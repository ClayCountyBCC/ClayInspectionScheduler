/// <reference path="app.ts" />
/// <reference path="transport.ts" />
/// <reference path="ui.ts" />
var InspSched;
(function (InspSched) {
    var NewInspection = /** @class */ (function () {
        function NewInspection(PermitNo, InspectionCd, SchecDateTime, Comment) {
            this.PermitNo = PermitNo;
            this.InspectionCd = InspectionCd;
            this.SchecDateTime = SchecDateTime;
            this.Comment = Comment;
        }
        return NewInspection;
    }());
    InspSched.NewInspection = NewInspection;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=newinspection.js.map