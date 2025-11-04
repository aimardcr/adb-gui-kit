export namespace backend {
	
	export class Device {
	    serial: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serial = source["serial"];
	        this.status = source["status"];
	    }
	}
	export class DeviceInfo {
	    model: string;
	    androidVersion: string;
	    buildNumber: string;
	    batteryLevel: string;
	
	    static createFrom(source: any = {}) {
	        return new DeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model = source["model"];
	        this.androidVersion = source["androidVersion"];
	        this.buildNumber = source["buildNumber"];
	        this.batteryLevel = source["batteryLevel"];
	    }
	}

}

