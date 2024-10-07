import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createField from '@salesforce/apex/LWCFieldCreatorController.createField';
import getToken from '@salesforce/apex/LWCFieldCreatorController.getToken';
import getTypeMappings from '@salesforce/apex/LWCFieldCreatorController.getTypeMappings';
import getFieldMappings from '@salesforce/apex/LWCFieldCreatorController.getFieldMappings';
import getObjectsViaToolingAPI from '@salesforce/apex/LWCFieldCreatorController.getObjectsViaToolingAPI';
import getProfilesAndPermissionSets from '@salesforce/apex/LWCFieldCreatorController.getProfilesAndPermissionSets';
import getLayoutsViaToolingAPI from '@salesforce/apex/LWCFieldCreatorController.getLayoutsViaToolingAPI';
import getGlobalValueSetsViaToolingAPI from '@salesforce/apex/LWCFieldCreatorController.getGlobalValueSetsViaToolingAPI';
import insertFLS from '@salesforce/apex/LWCFieldCreatorController.insertFLS';
import getLayoutMetadataViaToolingAPI from '@salesforce/apex/LWCFieldCreatorController.getLayoutMetadataViaToolingAPI';

export default class LwcFieldCreator extends LightningElement {
    
    // --------------------------
    // Global vars
    // --------------------------
    spinner = false;
    fieldPayload = {};
    oauthToken;
    customObjects = [];
    customSettings = [];
    customMetadata = [];
    typeMappings;
    fieldMappings;
    renderFieldMap = {};
    topType;
    objectType;
    fieldType;
    fieldLatLongDisplay;
    fieldLabel;
    fieldName;
    fieldDescription;
    fieldHelpText;
    fieldDisplayFormat;
    fieldStartingNumber;
    fieldLength;
    fieldNumberLength;
    fieldDecimalPlaces;
    fieldRequired = false;
    fieldUnique = false;
    fieldExternalId = false;
    fieldAIPrediction = false;
    overrideFieldName = false;
    fieldDefaultValueToggle = false;
    fieldDefaultValueText;
    fieldCaseSensitivity;
    fieldVisibleLines;
    fieldMaskType;
    fieldMaskCharacter;
    fieldGlobalPicklist;
    fieldLocalPicklist;
    fieldPicklistAlphabetical = false;
    fieldPicklistFirstValueDefault = false;
    fieldPicklistRestricted = false;
    returnedLayouts;
    returnedProfiles;
    returnedPermissionSets;
    fieldGlobalPicklistOptions;
    layoutValue = [];
    layoutOptions = [];
    picklistGlobalSelected;
    picklistLocalSelected;
    selectAllLayouts = false;
    showProfiles = true;
    showPermissionSets = true;
    @track profilesAndPermissionSets = [];
    selectAllReadAccess = false;
    selectAllEditAccess = false;
    totalReadAccessSelected;
    totalEditAccessSelected;

    // --------------------------
    // Init
    // --------------------------
    connectedCallback() {
        this.init();
    }

    async init() {
        try {
            this.spinner = true;
            this.oauthToken = await getToken();
            debugger;
            let returnedObjects = JSON.parse(await getObjectsViaToolingAPI({
                'token': this.oauthToken
            })).records;
            this.typeMappings = await getTypeMappings();
            this.fieldMappings = await getFieldMappings();
            for (var idx in returnedObjects) {
                let obj = returnedObjects[idx];
                if (obj.IsCustomSetting) {
                    this.customSettings.push({'label': obj.MasterLabel, 'value': obj.QualifiedApiName});
                } else if (obj.QualifiedApiName.substring(obj.QualifiedApiName.length - 5, obj.QualifiedApiName.length) == '__mdt') {
                    this.customMetadata.push({'label': obj.MasterLabel, 'value': obj.QualifiedApiName});
                } else {
                    this.customObjects.push({'label': obj.MasterLabel, 'value': obj.QualifiedApiName});
                }
            }
            this.spinner = false;
        } catch (error) {
            debugger;
            this.showToast('Error', error.body.message, 'error');
            this.spinner = false;
        }
    }
    
    // --------------------------
    // Getters
    // --------------------------
    get topOptions() {
        return [
            {'label': 'Custom Object', 'value': 'CustomObject'},
            {'label': 'Custom Metadata', 'value': 'CustomMetadata'},
            {'label': 'Custom Setting', 'value': 'CustomSetting'}
        ];
    }

    get objectOptions() {
        if (this.topType == 'CustomObject') {
            return this.customObjects;
        }
        if (this.topType == 'CustomMetadata') {
            return this.customMetadata;
        }
        if (this.topType == 'CustomSetting') {
            return this.customSettings;
        }
    }

    get renderGrid() {
        return this.objectType;
    }

    get fieldTypeOptions() {
        let opts = [];
        for (let key in this.typeMappings) {
            if (this.typeMappings[key].Available_For__c.includes(this.topType)) {
                opts.push({'label': this.typeMappings[key].MasterLabel, 'value': this.typeMappings[key].DeveloperName});        
            }
        }
        opts.sort(function (a, b) {
            const labelA = a.label;
            const labelB = b.label;
            let comparison = 0;
            if (labelA > labelB) {
                comparison = 1;
            } else if (labelA < labelB) {
                comparison = -1;
            }
            return comparison;
        });
        
        return opts;
    }

    get renderProfilePermsetVisibility() {
        return this.topType == 'CustomObject';
    }

    get renderPageLayoutVisibility() {
        return this.topType == 'CustomObject' || this.topType == 'CustomMetadata';
    }

    get fieldLatLongDisplayOptions() {
        return [
            {'label': 'Degrees, Minutes, Seconds', 'value': 'false'},
            {'label': 'Decimal', 'value': 'true'}
        ];
    }

    get picklistValueOptions() {
        return [
            {'label': 'Use global picklist value set', 'value': 'global'},
            {'label': 'Enter values, with each value separated by a new line', 'value': 'local'}
        ];
    }

    get fieldCaseSensitivityOptions() {
        return [
            {'label': 'Treat "ABC" and "abc" as duplicate values (case insensitive)', 'value': 'false'},
            {'label': 'Treat "ABC" and "abc" as different values (case sensitive)', 'value': 'true'}
        ];
    }

    get fieldMaskTypeOptions() {
        return [
            {'label': 'Mask All Characters', 'value': 'all'},
            {'label': 'Last Four Characters Clear', 'value': 'lastFour'},
            {'label': 'Credit Card Number', 'value': 'creditCard'},
            {'label': 'National Insurance Number', 'value': 'nino'},
            {'label': 'Social Security Number', 'value': 'ssn'},
            {'label': 'Social Insurance Number', 'value': 'sin'},
        ];
    }

    get fieldMaskCharacterOptions() {
        return [
            {'label': '*', 'value': 'asterisk'},
            {'label': 'X', 'value': 'X'}
        ];
    }

    get fieldNameDisabled() {
        return !this.overrideFieldName;
    }

    get selectAllLayoutsLabel() {
        return this.selectAllLayouts ? 'Deselect All' : 'Select All';
    }

    // --------------------------
    // Service Methods
    // --------------------------

    openDisplayLinkWindow() {
        let params = `scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no,
        width=600,height=600,left=0,top=0`;
        window.open(document.location.origin + '/setup/ui/whatisdisplayformat.jsp', 'What is a display format?', params);
    }

    handleTopSelection(event) {
        this.topType = event.target.value;
        this.objectType = null;
    }

    async handleObjectSelection(event) {
        this.objectType = event.target.value;
        // TODO activate to test layout development
        // if (this.topType == 'CustomObject' || this.topType == 'CustomMetadata') {
        //     this.returnedLayouts = JSON.parse(await getLayoutsViaToolingAPI({
        //         'token': this.oauthToken,
        //         'objectAPIName': this.objectType
        //     })).records;
        //     let opts = [];
        //     for (let idx in this.returnedLayouts) {
        //         let obj = this.returnedLayouts[idx];
        //         opts.push({'label': obj.Name, 'value': obj.Id});
        //     }
        //     this.layoutOptions = opts;
        // }
        if (this.topType == 'CustomObject') {
            this.returnedProfilesAndPermissionSets = await getProfilesAndPermissionSets();
            for (let idxProf in this.returnedProfilesAndPermissionSets) {
                let permName = this.returnedProfilesAndPermissionSets[idxProf].IsOwnedByProfile 
                    ? this.returnedProfilesAndPermissionSets[idxProf].Profile.Name
                    : this.returnedProfilesAndPermissionSets[idxProf].Label; 
                this.profilesAndPermissionSets.push({
                    'Id': this.returnedProfilesAndPermissionSets[idxProf].Id,
                    'Name': permName,
                    'Type': this.returnedProfilesAndPermissionSets[idxProf].IsOwnedByProfile ? 'Profile' : 'Permset',
                    'Visible': this.showProfiles,
                    'ReadChecked': false,
                    'EditChecked': false,
                    'ArrayIndex': idxProf
                });
            }
            this.recalculateSelectedPermissionsTotal();
        }
    }

    handleFieldTypeSelection(event) {
        this.fieldType = event.target.value;
        this.renderFieldMap = {};
        for (let key in this.fieldMappings) {
            let subKey =  this.fieldType + '__c';
            if (this.fieldMappings[key][subKey]) {
                this.renderFieldMap[key] = true;
            }
        }
    }

    async handlePicklistValueSelectionChange(event) {
        this.picklistGlobalSelected = event.target.value == 'global';
        this.picklistLocalSelected = event.target.value == 'local';
        if (this.picklistGlobalSelected) {
            this.fieldLocalPicklist = null;
        } else if (this.picklistLocalSelected) {
            this.fieldGlobalPicklist = null;
        }

        if (!this.fieldGlobalPicklistOptions && this.picklistGlobalSelected) {
            this.spinner = true;
            const results = await getGlobalValueSetsViaToolingAPI({
                'token': this.oauthToken
            });
            let resultsList = [];
            JSON.parse(results).records.forEach((element) => {
                resultsList.push({'label': element.MasterLabel, 'value': element.MasterLabel});
            });
            this.fieldGlobalPicklistOptions = resultsList;
            this.spinner = false;
        }
    }

    handleFieldLabelChange(event) {
        this.fieldLabel = event.target.value;
        if (!this.overrideFieldName) {
            this.fieldName = event.target.value.replaceAll(" ","_");
        }
        this.fieldPayload.label = event.target.value;
    }
    
    handleFieldNameChange(event) {
        this.fieldName = event.target.value;
        this.fieldPayload.name = event.target.value;
    }
    
    handleOverrideCheckbox(event) {
        this.overrideFieldName = event.target.checked;
    }

    handleFieldDescriptionChange(event) {
        this.fieldDescription = event.target.value;
    }

    handleFieldHelpTextChange(event) {
        this.fieldHelpText = event.target.value;
    }
    
    handleFieldDefaultValueToggleChange(event) {
        this.fieldDefaultValueToggle = event.target.checked;
    }

    handleFieldDefaultValueTextChange(event) {
        this.fieldDefaultValueText = event.target.value;
    }
    
    handleFieldRequiredChange(event) {
        this.fieldRequired = event.target.checked;
        if (this.template.querySelector('[data-id="fieldAIPrediction"]')) {
            this.template.querySelector('[data-id="fieldAIPrediction"]').checked = false;
        }
    }

    handleFieldUniqueChange(event) {
        this.fieldUnique = event.target.checked;
        if (this.template.querySelector('[data-id="fieldAIPrediction"]')) {
            this.template.querySelector('[data-id="fieldAIPrediction"]').checked = false;
        }
    }

    handleFieldExternalIdChange(event) {
        this.fieldExternalId = event.target.checked;
        if (this.template.querySelector('[data-id="fieldAIPrediction"]')) {
            this.template.querySelector('[data-id="fieldAIPrediction"]').checked = false;
        }
    }

    handleFieldAIPredictionChange(event) {
        this.fieldAIPrediction = event.target.checked;
        if (this.template.querySelector('[data-id="fieldRequired"]')) {
            this.template.querySelector('[data-id="fieldRequired"]').checked = false;
        }
        if (this.template.querySelector('[data-id="fieldUnique"]')) {
            this.template.querySelector('[data-id="fieldUnique"]').checked = false;
        }
        if (this.template.querySelector('[data-id="fieldExternalId"]')) {
            this.template.querySelector('[data-id="fieldExternalId"]').checked = false;
        }
    }

    handleFieldLengthChange(event) {
        this.fieldLength = event.target.value;
    }

    handleFieldNumberLengthChange(event) {
        this.fieldNumberLength = event.target.value;
    }

    handleFieldDecimalPlacesChange(event) {
        this.fieldDecimalPlaces = event.target.value;
    }

    handleFieldVisibleLinesChange(event) {
        this.fieldVisibleLines = event.target.value;
    }
    
    handleFieldDisplayFormatChange(event) {
        this.fieldDisplayFormat = event.target.value;
    }

    handleFieldStartingNumberChange(event) {
        this.fieldStartingNumber = event.target.value;
    }

    handleFieldMaskTypeSelection(event) {
        this.fieldMaskType = event.target.value;
    }

    handleFieldMaskCharacterSelection(event) {
        this.fieldMaskCharacter = event.target.value;
    }

    handleFieldGlobalPicklistChange(event) {
        this.fieldGlobalPicklist = event.target.value;
    }

    handleFieldLocalPicklistChange(event) {
        this.fieldLocalPicklist = event.target.value;
    }

    handleFieldPicklistAlphabeticalChange(event) {
        this.fieldPicklistAlphabetical = event.target.checked;
    }

    handleFieldPicklistFirstValueDefaultChange(event) {
        this.fieldPicklistFirstValueDefault = event.target.checked;
    }

    handleFieldPicklistRestrictedChange(event) {
        this.fieldPicklistRestricted = event.target.checked;
    }
    
    handleLayoutChange(event) {
        this.layoutValue = event.detail.value;
    }

    handleSelectAllLayouts(event) {
        this.selectAllLayouts = event.target.checked;
        if (this.selectAllLayouts) {
            let opts = [];
            for (var idx in this.layoutOptions) {
                opts.push(this.layoutOptions[idx].value);
            }
            this.layoutValue = opts;
        } else {
            this.layoutValue = [];
        }
    }

    handleShowProfiles(event) {
        this.showProfiles = event.target.checked;
        this.rebuildProfilesAndPermissionSets();
    }
    
    handleShowPermissionSets(event) {
        this.showPermissionSets = event.target.checked;
        this.rebuildProfilesAndPermissionSets();
    }

    handleSelectAllReadAccess(event) {
        this.selectAllReadAccess = event.target.checked;
        for (let idx in this.profilesAndPermissionSets) {
            if (this.selectAllReadAccess) {
                this.profilesAndPermissionSets[idx].ReadChecked = true;
            } else {
                this.profilesAndPermissionSets[idx].ReadChecked = false;
            }
        }
        this.recalculateSelectedPermissionsTotal();
    }
    
    handleSelectAllEditAccess(event) {
        this.selectAllEditAccess = event.target.checked;
        this.selectAllEditAccess = event.target.checked;
        for (let idx in this.profilesAndPermissionSets) {
            if (this.selectAllEditAccess) {
                this.profilesAndPermissionSets[idx].EditChecked = true;
            } else {
                this.profilesAndPermissionSets[idx].EditChecked = false;
            }
        }
        this.recalculateSelectedPermissionsTotal();
    }
    
    handleReadAccessClicked(event) {
        this.profilesAndPermissionSets[event.target.name].ReadChecked = event.target.checked;
        this.recalculateSelectedPermissionsTotal();
    }
    
    handleEditAccessClicked(event) {
        this.profilesAndPermissionSets[event.target.name].EditChecked = event.target.checked;
        this.recalculateSelectedPermissionsTotal();
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    rebuildProfilesAndPermissionSets() {
        let newArray = this.profilesAndPermissionSets;
        for (let idx in newArray) {
            if (newArray[idx].Type == 'Profile') {
                newArray[idx].Visible = this.showProfiles;
            }
            if (newArray[idx].Type == 'Permset') {
                newArray[idx].Visible = this.showPermissionSets;
            }
        }
        this.profilesAndPermissionSets = newArray;
    }

    recalculateSelectedPermissionsTotal() {
        let totalRead = 0;
        let totalEdit = 0;
        for (let idx in this.profilesAndPermissionSets) {
            if (this.profilesAndPermissionSets[idx].ReadChecked) {
                totalRead += 1;
            }
            if (this.profilesAndPermissionSets[idx].EditChecked) {
                totalEdit += 1;
            }
        }
        this.totalReadAccessSelected = totalRead;
        this.totalEditAccessSelected = totalEdit;
    }

    async submitField() {
        try {
            this.spinner = true;
            // Get shadow DOM elements
            let DOMMap = {};
            let inputs = this.template.querySelectorAll('lightning-input');
            let comboboxes = this.template.querySelectorAll('lightning-combobox');
            let radioGroups = this.template.querySelectorAll('lightning-radio-group');
            let textAreas = this.template.querySelectorAll('lightning-textarea');
            for (let idx=0; idx<inputs.length; idx++) {
                if (inputs[idx].name) {
                    DOMMap[inputs[idx].name] = inputs[idx];
                }
            }
            for (let idx=0; idx<comboboxes.length; idx++) {
                if (comboboxes[idx].name) {
                    DOMMap[comboboxes[idx].name] = comboboxes[idx];
                }
            }
            for (let idx=0; idx<radioGroups.length; idx++) {
                if (radioGroups[idx].name) {
                    DOMMap[radioGroups[idx].name] = radioGroups[idx];
                }
            }
            for (let idx=0; idx<textAreas.length; idx++) {
                if (textAreas[idx].name) {
                    DOMMap[textAreas[idx].name] = textAreas[idx];
                }
            }
    
            const allValid = [...this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-radio-group')]
                .reduce((validSoFar, inputFields) => {
                    inputFields.reportValidity();
                    return validSoFar && inputFields.checkValidity();
                }, true);
    
            if (allValid) {
                let payload = {
                    "FullName": this.objectType + '.' + this.fieldName + '__c',
                    "Metadata": {
                        "type": this.typeMappings[this.fieldType].SF_Type__c
                    }
                };
    
                Object.keys(this.renderFieldMap).forEach((element) => {
                    if (DOMMap[element] && DOMMap[element].value && this.fieldMappings[element].Payload_Key__c) {
                        payload.Metadata[this.fieldMappings[element].Payload_Key__c] = DOMMap[element].value;
                    }
                    if (DOMMap[element] && ['checkbox', 'toggle'].includes(DOMMap[element].type) && this.fieldMappings[element].Payload_Key__c) {
                        payload.Metadata[this.fieldMappings[element].Payload_Key__c] = DOMMap[element].checked;
                    }
                });
                // Handle special circumstances
                if (payload.Metadata.precision) {
                    payload.Metadata.precision = parseInt(payload.Metadata.precision) + parseInt(payload.Metadata.scale);
                }

                if (['Picklist', 'MultiselectPicklist'].includes(payload.Metadata.type)) {
                    payload.Metadata.valueSet = this.doPicklistPayload();
                }
                debugger;
                const createFieldResult = await createField({
                    "token": this.oauthToken,
                    "payload": JSON.stringify(payload)
                });
                console.log(createFieldResult);

                const flsResult = await insertFLS({
                    "sobjectName": this.objectType,
                    "fieldName": this.objectType + '.' + this.fieldName + '__c',
                    "permissionsPayload": JSON.stringify(this.profilesAndPermissionSets)
                });
                console.log(flsResult);

                // TODO activate to test layout development
                // const layoutMetadataResult = await getLayoutMetadataViaToolingAPI({
                //     "token": this.oauthToken,
                //     "selectedLayoutIds": this.layoutValue
                // });
                // console.log(layoutMetadataResult);
                // debugger;
                // layoutMetadataResult.forEach((element) => {
                //     console.log(element);
                //     debugger;
                //     JSON.parse(element).records[0].Metadata.layoutSections[0].layoutColumns[0].layoutItems.push({
                //         "behavior": "Edit",
                //         "field": this.fieldName + '__c'
                //     })
                // });

                this.spinner = false;
                this.showToast(
                    'Success', 
                    'Created field \"' + this.fieldLabel + '\" on ' + this.objectType, 
                    'success'
                );
            }
        } catch (error) {
            this.spinner = false;
            this.showToast(
                'Create Field failed', 
                'HTTP ' + error.status + ' ' + error.statusText + ': ' + JSON.parse(error.body.message)[0].message, 
                'error'
            );

        }
    }

    doPicklistPayload() {
        let valueSet = {};
        if (this.picklistGlobalSelected) {
            valueSet.restricted = true;
            valueSet.valueSetName = this.fieldGlobalPicklist;
        } else if (this.picklistLocalSelected) {
            valueSet.restricted = this.fieldPicklistRestricted;
            valueSet.valueSetDefinition = {};
            valueSet.valueSetDefinition.sorted = this.fieldPicklistAlphabetical;
            valueSet.valueSetDefinition.value = [];
            this.fieldLocalPicklist.split('\n').forEach((element, idx) => {
                valueSet.valueSetDefinition.value[idx] = {};
                valueSet.valueSetDefinition.value[idx].isActive = true;
                valueSet.valueSetDefinition.value[idx].valueName = element;
            });
            if (this.fieldPicklistFirstValueDefault) {
                valueSet.valueSetDefinition.value[0].default = true;
            }
        }

        return valueSet;
    }
}