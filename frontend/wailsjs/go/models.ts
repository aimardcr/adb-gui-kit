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
	export class FileEntry {
	    name: string;
	    type: string;
	    size: string;
	    permissions: string;
	    date: string;
	    time: string;
	
	    static createFrom(source: any = {}) {
	        return new FileEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.size = source["size"];
	        this.permissions = source["permissions"];
	        this.date = source["date"];
	        this.time = source["time"];
	    }
	}

}

