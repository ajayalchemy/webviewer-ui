import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import Icon from 'components/Icon';

import core from 'core';
import selectors from 'selectors';
import { mapAnnotationToKey, getDataWithKey } from '../../constants/map';
import { isMobileDevice } from 'src/helpers/device';
import getFormattedUnit from 'src/helpers/getFormattedUnit';

function EllipseMeasurementOverlay(props) {
  const { t, annotation, isOpen } = props;
  const isReadOnly = useSelector(state => selectors.isDocumentReadOnly(state));
  const annotationKey = mapAnnotationToKey(annotation);
  const { icon } = getDataWithKey(annotationKey);
  const scale = annotation.Scale;
  const precision = annotation.Precision;
  const unit = getFormattedUnit(annotation.Scale[1][1]);
  const renderScaleRatio = () => `${scale[0][0]} ${scale[0][1]} = ${scale[1][0]} ${unit}`;

  useEffect(() => {
    const onAnnotationChanged = () => {
      setRadius(computeRadius());
    };
    core.addEventListener('mouseMove', onAnnotationChanged);
    return () => {
      core.removeEventListener('mouseMove', onAnnotationChanged);
    };
  });

  const computeRadius = () => {
    const decimalPlaces = getNumberOfDecimalPlaces(annotation);
    const factor = annotation.Measure.axis[0].factor;
    const radiusInPts = (annotation.Width / 2).toFixed(decimalPlaces);
    return (radiusInPts * factor).toFixed(decimalPlaces);
  };

  const getNumberOfDecimalPlaces = annotation =>
    (annotation.Precision === 1
      ? 0
      : annotation.Precision.toString().split('.')[1].length);

  const finishAnnotation = () => {
    const tool = core.getTool('AnnotationCreateEllipseMeasurement');
    tool.finish();
  };

  const selectAnnotation = () => {
    const annotationManager = core.getAnnotationManager();
    annotationManager.selectAnnotation(annotation);
  };

  const deselectAnnot = () => {
    const annotationManager = core.getAnnotationManager();
    annotationManager.deselectAnnotation(annotation);
  };

  const onChangeRadiusLength = event => {
    const radius = Math.abs(event.target.value);
    const factor = annotation.Measure.axis[0].factor;
    const radiusInPts = radius / factor;
    const diameterInPts = radiusInPts * 2;
    const rect = annotation.getRect();
    let {X1, X2, Y1, Y2} = 0;
    X1 = rect['x1'];
    Y1 = rect['y1'];
    X2 = rect['x1'] + diameterInPts;
    Y2 = rect['y1'] + diameterInPts;
    const newRect = {x1:X1, y1:Y1, x2:X2, y2:Y2};

    annotation.setHeight(diameterInPts);
    annotation.setWidth(diameterInPts);
    annotation.resize(newRect);
    setRadius(radius);
    forceEllipseRedraw();
    finishAnnotation();
  };

  const forceEllipseRedraw = useCallback(() => {
    const annotationManager = core.getAnnotationManager();
    annotationManager.redrawAnnotation(annotation);
    annotationManager.trigger('annotationChanged', [[annotation], 'modify', []]);
  }, [annotation]);

  const getMaxDiameterInPts = useCallback(() => {
    const currentPageNumber = core.getCurrentPage();
    const documentWidth = window.documentViewer.getPageWidth(currentPageNumber);
    const documentHeight = window.documentViewer.getPageHeight(currentPageNumber);
    const startX = annotation['X'];
    const startY = annotation['Y'];

    const maxX = documentWidth - startX;
    const maxY = documentHeight - startY;

    return Math.min(maxX, maxY);
  }, [annotation]);

  const validateDiameter = event => {
    const radius = Math.abs(event.target.value);
    const factor = annotation.Measure.axis[0].factor;
    const radiusInPts = radius / factor;
    const diameterInPts = radiusInPts * 2;
    ensureDiameterIsWithinBounds(diameterInPts);
  };

  const ensureDiameterIsWithinBounds = useCallback(diameterInPts => {
    const maxDiameterInPts = getMaxDiameterInPts();

    if (diameterInPts > maxDiameterInPts) {
      const boundingRect = annotation.getRect();
      const {x1, x2, y1, y2} = boundingRect;
      let width = annotation.Width;
      let height = annotation.Height;
      const currentPageNumber = core.getCurrentPage();
      const documentWidth = window.documentViewer.getPageWidth(currentPageNumber);
      const documentHeight = window.documentViewer.getPageHeight(currentPageNumber);

      if (x2 > documentWidth) {
        boundingRect['x2'] = documentWidth;
        width = documentWidth - x1;
      }
      if (y2 > documentHeight) {
        boundingRect['y2'] = documentHeight;
        height = documentHeight - y1;
      }

      if (width < documentWidth) {
        annotation.setWidth(width);
      } else {
        annotation.setWidth(documentWidth);
      }
      if (height < documentHeight){
        annotation.setHeight(height);
      } else {
        annotation.setHeight(documentHeight);
      }
      annotation.resize(boundingRect);
      forceEllipseRedraw();
    }
  }, [annotation, forceEllipseRedraw, getMaxDiameterInPts]);


  useEffect(() => {
    if (!isOpen) {
      ensureDiameterIsWithinBounds(annotation.getWidth());
    }
  }, [annotation, ensureDiameterIsWithinBounds, isOpen]);

  const [radius, setRadius] = useState(computeRadius());

  return (
    <>
      <div className="measurement__title">
        {icon && <Icon className="measurement__icon" glyph={icon}/>}
        {t('option.measurementOverlay.areaMeasurement')}
      </div>
      <div className="measurement__scale">
        {t('option.measurementOverlay.scale')}: {renderScaleRatio()}
      </div>
      <div className="measurement__precision">
        {t('option.shared.precision')}: {precision}
      </div>
      <div className="measurement__value">
        {t('option.measurementOverlay.area')}: {annotation.getContents()}
      </div>
      <div className="measurement__value">
        {t('option.measurementOverlay.radius')}:
        <input
          autoFocus={!isMobileDevice}
          className="lineMeasurementInput"
          type="number"
          min="0"
          disabled={isReadOnly}
          value={radius}
          onChange={event => {
            onChangeRadiusLength(event);
            selectAnnotation();
          }}
          onBlur={event => validateDiameter(event)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              onChangeRadiusLength(event);
              deselectAnnot();
            }
          }}
        /> {unit}
      </div>
    </>
  );
}

EllipseMeasurementOverlay.propTypes = {
  annotation: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default withTranslation()(EllipseMeasurementOverlay);