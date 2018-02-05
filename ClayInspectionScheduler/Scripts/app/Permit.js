/// <reference path="transport.ts" />
/// <reference path="ui.ts" />
var InspSched;
(function (InspSched) {

    var access_type;
    (function (access_type) {
        access_type[access_type["no_access"] = 0] = "no_access";
        access_type[access_type["public_access"] = 1] = "public_access";
        access_type[access_type["basic_access"] = 2] = "basic_access";
        access_type[access_type["inspector_access"] = 3] = "inspector_access";
    })(access_type = InspSched.access_type || (InspSched.access_type = {}));
    var Permit = /** @class */ (function () {
        function Permit(IsExternalUser) {
        }
        return Permit;
    }());
    InspSched.Permit = Permit;
})(InspSched || (InspSched = {}));
//# sourceMappingURL=Permit.js.map