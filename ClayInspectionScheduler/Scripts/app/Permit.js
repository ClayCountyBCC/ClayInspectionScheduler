/// <reference path="transport.ts" />
/// <reference path="ui.ts" />
var InspSched;
(function (InspSched) {
    var Permit = (function () {
        function Permit(IsExternalUser) {
            this.IsExternalUser = true;
        }
        return Permit;
    }());
    InspSched.Permit = Permit;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=Permit.js.map