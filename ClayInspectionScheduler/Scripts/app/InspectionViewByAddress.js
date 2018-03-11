/// <reference path="shortinspection.ts" />
var InspSched;
(function (InspSched) {
    var InspectionViewByAddress = /** @class */ (function () {
        function InspectionViewByAddress(inspection) {
            if (inspection === void 0) { inspection = null; }
            this.Address = "";
            this.GeoZone = "";
            this.FloodZone = "";
            this.Inspector = "";
            this.IsPrivateProvider = false;
            this.IsCommercial = false;
            this.Inspections = [];
            if (inspection !== null) {
                this.Address = inspection.StreetAddress;
                this.FloodZone = inspection.FloodZone;
                this.GeoZone = inspection.GeoZone;
                this.Inspector = inspection.InspectorName;
                this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
                this.IsCommercial = inspection.IsCommercial;
            }
        }
        return InspectionViewByAddress;
    }());
    InspSched.InspectionViewByAddress = InspectionViewByAddress;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=InspectionViewByAddress.js.map