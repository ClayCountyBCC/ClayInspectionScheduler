var InspSched;
(function (InspSched) {
    var LocationHash // implements ILocationHash
     = /** @class */ (function () {
        function LocationHash(locationHash) {
            this.Permit = "";
            this.Day = ""; // can be Today or Tomorrow
            this.Inspector = ""; // can be an inspector's name or identifier.
            this.InspectionId = 0;
            var ha = locationHash.split("&");
            for (var i = 0; i < ha.length; i++) {
                var k = ha[i].split("=");
                switch (k[0].toLowerCase()) {
                    case "permit":
                        this.Permit = k[1];
                        break;
                    case "inspector":
                        this.Inspector = k[1];
                        break;
                    case "day":
                        this.Day = k[1];
                        break;
                    case "inspectionid":
                        this.InspectionId = parseInt(k[1]);
                        break;
                }
            }
        }
        LocationHash.prototype.UpdatePermit = function (permit) {
            // and using its current properties, going to emit an updated hash
            // with a new EmailId.
            var h = "";
            if (permit.length > 0)
                h += "&permit=" + permit;
            return h.substring(1);
        };
        LocationHash.prototype.ToHash = function () {
            var h = "";
            if (this.Permit.length > 0)
                h += "&permit=" + this.Permit;
            if (this.Day.length > 0)
                h += "&day=" + this.Day;
            if (this.Inspector.length > 0)
                h += "&inspector=" + this.Inspector;
            if (this.InspectionId > 0)
                h += "&inspectionid=" + this.InspectionId.toString();
            if (h.length > 0)
                h = "#" + h.substring(1);
            return h;
        };
        return LocationHash;
    }());
    InspSched.LocationHash = LocationHash;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=LocationHash.js.map