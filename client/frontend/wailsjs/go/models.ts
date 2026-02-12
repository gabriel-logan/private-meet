export namespace main {
	
	export class HttpResponse {
	    status: number;
	    statusText: string;
	    body: string;
	    headers: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new HttpResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.statusText = source["statusText"];
	        this.body = source["body"];
	        this.headers = source["headers"];
	    }
	}

}

