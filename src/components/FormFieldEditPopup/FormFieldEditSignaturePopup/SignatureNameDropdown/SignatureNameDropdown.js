/* eslint-disable indent */
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Select, { components } from 'react-select';
import Icon from 'src/components/Icon';

import "./SignatureNameDropdown.scss";

const SignatureNameDropdown = (field, total_users, isValid) => {
	const { t } = useTranslation();
	const isError = field.required && !isValid;

	const nameOptions = useMemo(() => {
		let options = [{ label: `Advisor`, value: 'signature.advisor[0]' }];
		if (total_users > 0) {
			for (let index = 1; index <= total_users; index++) {
				if (index === 1) {
					options.push({ label: `Client`, value: 'signature.client[0]' });
				} else {
					options.push({ label: `Co Applicant ${index - 1}`, value: `signature.applicant_${index - 1}[0]` });
				}
			}
		}
		return options;
	}, [total_users]);

	const CustomArrowIndicator = props => {
		const { selectProps } = props;
		const { menuIsOpen } = selectProps;

		return (
			<React.Fragment>
				<components.IndicatorsContainer {...props}>
					<Icon className="arrow" glyph={`icon-chevron-${menuIsOpen ? 'up' : 'down'}`} />
				</components.IndicatorsContainer>
			</React.Fragment>
		);
	};

	const getStyles = useCallback(
		isDarkMode => ({
			valueContainer: base => ({
				...base,
				padding: '2px',
			}),
			control: base => ({
				...base,
				backgroundColor: isDarkMode ? '#21242A' : '#FFFFFF',
				minHeight: '28px',
				borderColor: isDarkMode ? '#485056' : '#CFD4DA',
				'&:hover': {
					borderColor: isDarkMode ? '#485056' : '#CFD4DA',
				},
			}),
			container: base => ({
				...base,
				backgroundColor: isDarkMode ? '#21242A' : '#FFFFFF',
				height: '29px',
				borderColor: isDarkMode ? '#485056' : 'red',
				'&:hover': {
					borderColor: isDarkMode ? '#485056' : '#CFD4DA',
				},
			}),
			indicatorsContainer: base => {
				return {
					...base,
					paddingRight: '6px',
					height: '26px',
				};
			},
		}),
		[],
	);

	const styles = useMemo(() => getStyles(false), [getStyles]);

	const onChange = option => {
		if (option?.value) {
			field.onChange(option.value);
		}
	};

	return (
		<div className="form-group" key={field.label}>
			<label 			>
				{t(field.label)}{field.required ? '*' : ''}:
			</label>
			<div style={{ marginTop: 5 }}>
				<Select
					onChange={onChange}
					styles={styles}
					options={nameOptions}
					isSearchable={false}
					isClearable={false}
					placeholder="Select user type"
					components={{ IndicatorsContainer: CustomArrowIndicator }}
				/>
			</div>
			{isError && (
				<span className="error-label">
					Please select appropriate field name
				</span>
			)}
		</div>
	);
};

export default SignatureNameDropdown;