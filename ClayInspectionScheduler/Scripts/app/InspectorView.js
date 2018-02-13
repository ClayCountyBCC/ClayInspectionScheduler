/// <reference path="shortinspection.ts" />
var InspSched;
(function (InspSched) {
    var InspectorView = /** @class */ (function () {
        function InspectorView(inspection) {
            if (inspection === void 0) { inspection = null; }
            this.PermitNumber = "";
            this.Address = "";
            this.GeoZone = "";
            this.FloodZone = "";
            this.Inspector = "";
            this.IsPrivateProvider = false;
            this.Inspections = [];
            if (inspection !== null) {
                this.PermitNumber = inspection.PermitNo;
                this.Address = inspection.StreetAddress;
                this.FloodZone = inspection.FloodZone;
                this.GeoZone = inspection.GeoZone;
                this.Inspector = inspection.InspectorName;
                this.IsPrivateProvider = inspection.PrivateProviderInspectionRequestId > 0;
            }
        }
        InspectorView.prototype.ProcessIVData = function (inspections, day, inspector) {
            if (day === void 0) { day = ""; }
            if (inspector === void 0) { inspector = ""; }
            // We're going to filter our results if a day or inspector was passed.
            var ivList = [];
            // if we have a day or inspector set to filter on
            // let's go ahead and filter the list of inspections
            // based on them.
            var fInspections = inspections.filter(function (i) {
                var inspectorCheck = inspector.length > 0 ? i.InspectorName === inspector : true;
                var dayCheck = day.length > 0 ? i.Day === day : true;
                return inspectorCheck && dayCheck;
            });
            // get a unique list of permit numbers.
            var permitNumbers = fInspections.map(function (p) {
                return p.PermitNo;
            });
            permitNumbers = permitNumbers.filter(function (value, index, self) { return index === self.indexOf(value); });
            var _loop_1 = function (p) {
                var i = fInspections.filter(function (j) {
                    return j.PermitNo === p;
                });
                var iv = new InspectorView(i[0]); // we'll base the inspectorView off of the first inspection returned.
                iv.Inspections = i.map(function (insp) {
                    return new InspSched.ShortInspection(insp.InspReqID, insp.InspectionCode + '-' + insp.InsDesc);
                });
                ivList.push(iv);
            };
            // let's coerce the inspection data into the IV format.
            for (var _i = 0, permitNumbers_1 = permitNumbers; _i < permitNumbers_1.length; _i++) {
                var p = permitNumbers_1[_i];
                _loop_1(p);
            }
            console.log("ivList", ivList);
            return ivList;
        };
        return InspectorView;
    }());
    InspSched.InspectorView = InspectorView;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=inspectorview.js.map