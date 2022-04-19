/**
 * @description An implementation of HttpCalloutMock used to respond to all HTTP requests made by Data Classification
 * App test methods.
 */
@IsTest
public class DataClassificationMock implements HttpCalloutMock {
	/**
	 * @description Provides a simulated response for HTTP requests made by test methods.
	 *
	 * @param req An HTTP Request initiated by a test method.
	 *
	 * @return A simulated OK HTTP Response with an empty map payload.
	 */
	public HttpResponse respond(HttpRequest req) {
		System.assert(req.getEndpoint().contains('/services/data/v45.0/tooling/query/?q='),
				'Received an unexpected HTTP Request endpoint.');
		System.assertEquals('GET', req.getMethod(), 'Received an unsupported HTTP Request method.');

		HttpResponse res = new HttpResponse();
		res.setBody(JSON.serialize(new Map<String, Object>()));
		res.setStatus('OK');
		res.setStatusCode(200);
		return res;
	}
}