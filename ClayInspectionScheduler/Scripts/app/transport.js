/// <reference path="XHR.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
var InspSched;
(function (InspSched) {
    var transport;
    (function (transport) {
        "use strict";
        function GetPermit(key) {
            var x = XHR.Get("API/Permit/Get/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var pl = JSON.parse(response.Text);
                    resolve(pl);
                }).catch(function () {
                    console.log("error in GetPermit");
                    reject(null);
                });
            });
        }
        transport.GetPermit = GetPermit;
        function GetInspType() {
            var x = XHR.Get("API/InspType/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var pl = JSON.parse(response.Text);
                    resolve(pl);
                }).catch(function () {
                    console.log("error in GetInspTypeList");
                    reject(null);
                });
            });
        }
        transport.GetInspType = GetInspType;
        function GetInspections(key) {
            var x = XHR.Get("API/Inspection/Permit/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var il = JSON.parse(response.Text);
                    resolve(il);
                }).catch(function () {
                    console.log("error in GetInspections");
                    reject(null);
                });
            });
        }
        transport.GetInspections = GetInspections;
        function SaveInspection(thisInspection) {
            var x = XHR.Post("API/NewInspection/", JSON.stringify(thisInspection));
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    InspSched.UI.GetInspList(thisInspection.PermitNo);
                    resolve(di);
                }).catch(function () {
                    console.log("error in SaveInspections");
                    InspSched.UI.GetInspList(thisInspection.PermitNo);
                    reject(null);
                });
            });
        }
        transport.SaveInspection = SaveInspection;
        function AddComment(InspectionId, Comment) {
            var data = {
                'InspectionId': InspectionId,
                'Comment': Comment
            };
            var x = XHR.Post("API/Inspection/Comment/", JSON.stringify(data));
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in Post Comment");
                    reject(null);
                });
            });
        }
        transport.AddComment = AddComment;
        function CancelInspection(InspectionId, PermitNumber) {
            var x = XHR.Post("API/Inspection/PublicCancel/" + PermitNumber + "/" + InspectionId);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in GetInspections");
                    reject(null);
                });
            });
        }
        transport.CancelInspection = CancelInspection;
        function UpdateInspection(PermitNumber, InspectionId, ResultCode, Remarks, Comments) {
            var data = {
                'permitNumber': PermitNumber,
                'inspectionId': InspectionId,
                'resultCode': ResultCode,
                'remark': Remarks,
                'comment': Comments
            };
            var x = XHR.Post("API/Inspection/Update/", JSON.stringify(data));
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in Inspection Update");
                    reject(null);
                });
            });
        }
        transport.UpdateInspection = UpdateInspection;
        function DailyInspections() {
            var x = XHR.Get("API/Inspection/List");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in Daily Inspections");
                    reject(null);
                });
            });
        }
        transport.DailyInspections = DailyInspections;
        function Inspectors() {
            var x = XHR.Get("API/Inspection/Inspectors");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in Get Inspectors");
                    reject(null);
                });
            });
        }
        transport.Inspectors = Inspectors;
        function GetInspectionQuickRemarks() {
            var x = XHR.Get("API/Inspection/QuickRemarks");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var di = JSON.parse(response.Text);
                    resolve(di);
                }).catch(function () {
                    console.log("error in Get Quick Remarks");
                    reject(null);
                });
            });
        }
        transport.GetInspectionQuickRemarks = GetInspectionQuickRemarks;
    })(transport = InspSched.transport || (InspSched.transport = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=transport.js.map