@IsTest (IsParallel=true)
public class DataClassificationReportControllerTST {
	@IsTest
	public static void testGetEntityData() {
        Test.startTest();
		String res = DataClassificationReportController.getEntityData('Account');
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testGetEntities() {
        Test.startTest();
		String res = DataClassificationReportController.getEntities();
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testGetMetadataForValues() {
        Test.startTest();
		String res = DataClassificationReportController.getMetadataForValues();
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testGetEntitiesForInput() {
        Test.startTest();
		String res = DataClassificationReportController.getEntitiesForInput();
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testSaveMetaValues() {
		List<String> fieldNameList = new List<String>{'reportable_entity_json__c'};
		List<String> fieldValueList = new List<String>{'["lead","account","order"]'};

        Test.startTest();
		String res = DataClassificationReportController.saveMetaValues(fieldNameList, fieldValueList);
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testGetMetadataForOmittedValues() {
        Test.startTest();
		String res = DataClassificationReportController.getMetadataForOmittedValues();
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testHandleRecentFieldsApex() {
		Test.setMock(HttpCalloutMock.class, new DataClassificationMock());

        Test.startTest();
		String res = DataClassificationReportController.handleRecentFieldsApex(JSON.serialize(Datetime.now().millisecond()));
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testGetEntityDataSingle() {
        Test.startTest();
		String res = DataClassificationReportController.getEntityDataSingle('account', 'name');
        Test.stopTest();

		System.assertNotEquals(null, res);
	}

	@IsTest
	public static void testHandleNameTranslation() {
		String lstSerialized = JSON.serialize(new List<String>{'testValue'});

        Test.startTest();
		String res = DataClassificationReportController.handleNameTranslation(lstSerialized);
        Test.stopTest();

		System.assertNotEquals(null, res);
	}
}