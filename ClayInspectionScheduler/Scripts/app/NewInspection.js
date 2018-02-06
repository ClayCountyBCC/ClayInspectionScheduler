/// <reference path="app.ts" />
/// <reference path="transport.ts" />
/// <reference path="ui.ts" />
var InspSched;
(function (InspSched) {
    var NewInspection = /** @class */ (function () {
        function NewInspection(PermitNo, InspectionCd, SchecDateTime, Comments) {
            this.PermitNo = PermitNo;
            this.InspectionCd = InspectionCd;
            this.SchecDateTime = SchecDateTime;
            this.Comments = Comments;
        }
        return NewInspection;
    }());
    InspSched.NewInspection = NewInspection;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=newinspection.js.map