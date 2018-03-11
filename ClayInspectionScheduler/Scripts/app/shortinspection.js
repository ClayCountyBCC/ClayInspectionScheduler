var InspSched;
(function (InspSched) {
    var ShortInspection = /** @class */ (function () {
        function ShortInspection(i) {
            this.InspectionDesc = i.InspectionCode + '-' + i.InsDesc;
            this.PermitNumber = i.PermitNo;
            this.InspectionId = i.InspReqID;
            this.Comments = i.Comment;
            this.ResultADC = i.ResultADC;
        }
        return ShortInspection;
    }());
    InspSched.ShortInspection = ShortInspection;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=shortinspection.js.map