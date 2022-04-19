import {api, LightningElement} from 'lwc';
import {exportCSV} from 'c/exportUtil';

/**
 * The Javascript controller for the DataClassificationFieldsTable LWC, responsible for populating the table with data
 * and enabling download of that same data.
 */
export default class DataClassificationFieldsTable extends LightningElement {
	/** The label (name) of a Salesforce object. */
	@api objectName;
	/** An array of Javascript objects, representing the Salesforce object's fields and their classification/compliance
	 * settings. */
	@api tableData;

	/**
	 * Initiates a download of a CSV with the Salesforce object field data, named according to the object & table title.
	 */
	handleCSVDownload() {
		exportCSV(this.objectName + ' Field Audit Report', this.tableData);
	}
}