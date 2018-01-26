var InspSched;
(function (InspSched) {
    var LocationHash // implements ILocationHash
     = /** @class */ (function () {
        function LocationHash(locationHash) {
            this.Permit = "";
            var ha = locationHash.split("&");
            for (var i = 0; i < ha.length; i++) {
                var k = ha[i].split("=");
                switch (k[0].toLowerCase()) {
                    case "permit":
                        this.Permit = k[1];
                        break;
                }
            }
        }
        LocationHash.prototype.update = function (permit) {
            // and using its current properties, going to emit an updated hash
            // with a new EmailId.
            var h = "";
            if (permit.length > 0)
                h += "&permit=" + permit;
            return h.substring(1);
        };
        return LocationHash;
    }());
    InspSched.LocationHash = LocationHash;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=LocationHash.js.map