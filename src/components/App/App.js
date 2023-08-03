import actions from 'actions';
import classNames from 'classnames';
import core from 'core';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { hot } from 'react-hot-loader/root';
import { useDispatch, useSelector, useStore } from 'react-redux';
import selectors from 'selectors';

import Accessibility from 'components/Accessibility';
import AnnotationContentOverlay from 'components/AnnotationContentOverlay';
import AnnotationPopup from 'components/AnnotationPopup';
import AudioPlaybackPopup from 'components/AudioPlaybackPopup';
import BottomHeader from 'components/BottomHeader';
import ColorPickerModal from 'components/ColorPickerModal';
import ContentEditLinkModal from 'components/ContentEditLinkModal';
import ContentEditModal from 'components/ContentEditModal';
import ContextMenuPopup from 'components/ContextMenuPopup';
import CopyTextHandler from 'components/CopyTextHandler';
import CreateStampModal from 'components/CreateStampModal';
import CustomElement from 'components/CustomElement';
import CustomModal from 'components/CustomModal';
import DocumentContainer from 'components/DocumentContainer';
import DocumentCropPopup from 'components/DocumentCropPopup';
import ErrorModal from 'components/ErrorModal';
import FilePickerHandler from 'components/FilePickerHandler';
import FilterAnnotModal from 'components/FilterAnnotModal';
import FontHandler from 'components/FontHandler';
import FormFieldEditPopup from 'components/FormFieldEditPopup';
import FormFieldIndicatorContainer from 'components/FormFieldIndicator';
import GenericOutlinesPanel from 'components/GenericOutlinesPanel';
import Header from 'components/Header';
import InsertPageModal from 'components/InsertPageModal';
import LeftHeader from 'components/LeftHeader';
import LeftPanel from 'components/LeftPanel';
import LeftPanelOverlayContainer from 'components/LeftPanelOverlay';
import LinkModal from 'components/LinkModal';
import LoadingModal from 'components/LoadingModal';
import MenuOverlay from 'components/MenuOverlay';
import Model3DModal from 'components/Model3DModal';
import MultiTabEmptyPage from 'components/MultiTabEmptyPage';
import MultiViewer from 'components/MultiViewer';
import ComparePanel from 'components/MultiViewer/ComparePanel';
import NotesPanel from 'components/NotesPanel';
import OpenFileModal from 'components/OpenFileModal';
import PageManipulationOverlay from 'components/PageManipulationOverlay';
import PageRedactionModal from 'components/PageRedactionModal';
import PageReplacementModal from 'components/PageReplacementModal';
import Panel from 'components/Panel';
import PasswordModal from 'components/PasswordModal';
import PrintHandler from 'components/PrintHandler';
import PrintModal from 'components/PrintModal';
import ProgressModal from 'components/ProgressModal';
import RedactionPanel from 'components/RedactionPanel';
import RichTextPopup from 'components/RichTextPopup';
import RightHeader from 'components/RightHeader';
import RightPanel from 'components/RightPanel';
import SaveModal from 'components/SaveModal';
import ScaleModal from 'components/ScaleModal';
import SearchPanel from 'components/SearchPanel';
import SettingsModal from 'components/SettingsModal';
import SignatureModal from 'components/SignatureModal';
import SignatureValidationModal from 'components/SignatureValidationModal';
import TextEditingPanel from 'components/TextEditingPanel';
import TextPopup from 'components/TextPopup';
import TopHeader from 'components/TopHeader';
import ViewControlsOverlay from 'components/ViewControlsOverlay';
import WarningModal from 'components/WarningModal';
import WatermarkPanel from 'components/WatermarkPanel';
import Wv3dPropertiesPanel from 'components/Wv3dPropertiesPanel';
import ZoomOverlay from 'components/ZoomOverlay';
import Events from 'constants/events';
import overlays from 'constants/overlays';
import { panelNames } from 'constants/panel';
import fireEvent from 'helpers/fireEvent';
import getHashParameters from 'helpers/getHashParameters';
import hotkeysManager from 'helpers/hotkeysManager';
import loadDocument from 'helpers/loadDocument';
import setDefaultDisabledElements from 'helpers/setDefaultDisabledElements';
import { prepareMultiTab } from 'helpers/TabManager';
import setLanguage from 'src/apis/setLanguage';

import './App.scss';

// TODO: Use constants
const tabletBreakpoint = window.matchMedia('(min-width: 641px) and (max-width: 900px)');

const propTypes = {
  removeEventHandlers: PropTypes.func.isRequired,
};

const App = ({ removeEventHandlers }) => {
  const store = useStore();
  const dispatch = useDispatch();
  let timeoutReturn;

  const [isInDesktopOnlyMode, isMultiViewerMode, customFlxPanels] = useSelector(state => [
    selectors.isInDesktopOnlyMode(state),
    selectors.isMultiViewerMode(state),
    selectors.getCustomFlxPanels(state),
  ]);

  useEffect(() => {
    // To avoid race condition with window.dispatchEvent firing before window.addEventListener
    setTimeout(() => {
      fireEvent(Events.VIEWER_LOADED);
    }, 300);
    window.parent.postMessage(
      {
        type: 'viewerLoaded',
        id: parseInt(getHashParameters('id'), 10),
      },
      '*',
    );

    function loadInitialDocument() {
      const state = store.getState();
      const doesAutoLoad = getHashParameters('auto_load', true);
      let initialDoc = getHashParameters('d', '');
      initialDoc = initialDoc ? JSON.parse(initialDoc) : '';
      initialDoc = Array.isArray(initialDoc) ? initialDoc : [initialDoc];
      const isMultiTabAlreadyEnabled = state.viewer.isMultiTab;
      const isMultiDoc = initialDoc.length > 1;
      const startOffline = getHashParameters('startOffline', false);
      const basePath = getHashParameters('basePath', '');
      window.Core.setBasePath(basePath);

      if (isMultiDoc && !isMultiTabAlreadyEnabled) {
        prepareMultiTab(initialDoc, store);
        initialDoc = initialDoc[0];
        if ((initialDoc && doesAutoLoad) || startOffline) {
          const options = {
            externalPath: getHashParameters('p', ''),
            documentId: getHashParameters('did', null),
          };
          loadDocument(dispatch, initialDoc, options);
        }
      } else {
        const activeTab = state.viewer.activeTab || 0;
        initialDoc = initialDoc[activeTab];
        if ((initialDoc && doesAutoLoad) || startOffline) {
          const options = {
            extension: getHashParameters('extension', null),
            filename: getHashParameters('filename', null),
            externalPath: getHashParameters('p', ''),
            documentId: getHashParameters('did', null),
            showInvalidBookmarks: getHashParameters('showInvalidBookmarks', null),
          };

          loadDocument(dispatch, initialDoc, options);
        }
      }
    }

    function loadDocumentAndCleanup() {
      loadInitialDocument();
      window.removeEventListener('message', messageHandler);
      clearTimeout(timeoutReturn);
    }

    function messageHandler(event) {
      if (event.isTrusted && typeof event.data === 'object' && event.data.type === 'viewerLoaded') {
        loadDocumentAndCleanup();
      }
    }

    window.addEventListener('blur', () => {
      dispatch(actions.closeElements(overlays));
    });
    window.addEventListener('message', messageHandler, false);

    // In case WV is used outside of iframe, postMessage will not
    // receive the message, and this timeout will trigger loadInitialDocument
    timeoutReturn = setTimeout(loadDocumentAndCleanup, 500);

    return removeEventHandlers;
  }, []);

  useEffect(() => {
    const setTabletState = () => {
      // TODO: Use constants
      dispatch(actions.setLeftPanelWidth(251));
      dispatch(actions.setNotesPanelWidth(293));
      dispatch(actions.setSearchPanelWidth(293));
    };

    const onBreakpoint = () => {
      if (tabletBreakpoint.matches) {
        setTabletState();
      }
    };
    tabletBreakpoint.addListener(onBreakpoint);
  }, []);

  // These need to be done here to wait for the persisted values loaded in redux
  useEffect(() => {
    setLanguage(store)(store.getState().viewer.currentLanguage);
    hotkeysManager.initialize(store);
    setDefaultDisabledElements(store);
  }, []);

  const panels = customFlxPanels.map((panel, index) => {
    return (
      panel.render && (
        <Panel key={index} dataElement={panel.dataElement} location={panel.location}>
          {Object.values(panelNames).includes(panel.render) ? (
            panel.render === panelNames.OUTLINE && <GenericOutlinesPanel />
          ) : (
            <CustomElement
              key={panel.dataElement || index}
              className={`Panel ${panel.dataElement}`}
              display={panel.dataElement}
              dataElement={panel.dataElement}
              render={panel.render}
            />
          )}
        </Panel>
      )
    );
  });

  return (
    <React.Fragment>
      <div className={classNames({ 'App': true, 'is-in-desktop-only-mode': isInDesktopOnlyMode })}>
        <Accessibility />
        <Header />
        <TopHeader />
        <div className="content">
          <LeftHeader />
          <LeftPanel />
          {panels}
          {!isMultiViewerMode && <DocumentContainer />}
          {window?.ResizeObserver && <MultiViewer />}
          <RightHeader />
          <RightPanel dataElement="searchPanel" onResize={width => dispatch(actions.setSearchPanelWidth(width))}>
            <SearchPanel />
          </RightPanel>
          <RightPanel dataElement="notesPanel" onResize={width => dispatch(actions.setNotesPanelWidth(width))}>
            <NotesPanel />
          </RightPanel>
          <RightPanel dataElement="redactionPanel" onResize={width => dispatch(actions.setRedactionPanelWidth(width))}>
            <RedactionPanel />
          </RightPanel>
          <RightPanel dataElement="watermarkPanel" onResize={width => dispatch(actions.setWatermarkPanelWidth(width))}>
            <WatermarkPanel />
          </RightPanel>
          <RightPanel
            dataElement="wv3dPropertiesPanel"
            onResize={width => dispatch(actions.setWv3dPropertiesPanelWidth(width))}
          >
            <Wv3dPropertiesPanel />
          </RightPanel>
          <MultiTabEmptyPage />
          <RightPanel
            dataElement="textEditingPanel"
            onResize={width => dispatch(actions.setTextEditingPanelWidth(width))}
          >
            <TextEditingPanel />
          </RightPanel>
          {isMultiViewerMode && <RightPanel dataElement="comparePanel" onResize={width => dispatch(actions.setComparePanelWidth(width))}>
            <ComparePanel />
          </RightPanel>}
          <BottomHeader />
        </div>
        <ViewControlsOverlay />
        <MenuOverlay />
        <ZoomOverlay />
        <AnnotationContentOverlay />
        <PageManipulationOverlay />
        <LeftPanelOverlayContainer />
        <FormFieldIndicatorContainer />

        <AnnotationPopup />
        <FormFieldEditPopup />
        <TextPopup />
        <ContextMenuPopup />
        <RichTextPopup />
        <AudioPlaybackPopup />
        <DocumentCropPopup />

        {/* Modals */}
        <ContentEditLinkModal />
        <SignatureModal />
        <ScaleModal />
        <PrintModal />
        <LoadingModal />
        <ErrorModal />
        <WarningModal />
        <PasswordModal />
        <ProgressModal />
        <CreateStampModal />
        <PageReplacementModal />
        <LinkModal />
        <ContentEditModal />
        <FilterAnnotModal />
        <CustomModal />
        <Model3DModal />
        <ColorPickerModal />
        <PageRedactionModal />
        {core.isFullPDFEnabled() && <SignatureValidationModal />}
        <OpenFileModal />
        <SettingsModal />
        <SaveModal />
        <InsertPageModal />
      </div>

      <PrintHandler />
      <FilePickerHandler />
      <CopyTextHandler />
      <FontHandler />
    </React.Fragment>
  );
};

App.propTypes = propTypes;

export default hot(App);
