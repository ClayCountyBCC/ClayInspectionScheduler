var InspSched;
(function (InspSched) {
    var LocationHash // implements ILocationHash
     = (function () {
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
        return LocationHash;
    }());
    InspSched.LocationHash = LocationHash;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=LocationHash.js.map