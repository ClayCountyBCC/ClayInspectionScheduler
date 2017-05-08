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
            var x = XHR.Get("API/Permit/" + key);
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
            var x = XHR.Get("API/Inspection/" + key);
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
            console.log("In transport.SaveInspection: " + JSON.stringify(thisInspection));
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
        function CancelInspection(InspID, key) {
            var x = XHR.Delete("API/Inspection/" + key + "/" + InspID);
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
        //export function GenerateDates() {
        //    var x = XHR.Get("API/Dates/");
        //    return new Promise(function(resolve, reject) {
        //        x.then(function(response) {
        //            var di = JSON.parse(response.Text);
        //            resolve(di);
        //        }).catch(function() {
        //            console.log("error in CheckContractorPermitStatus");
        //            reject(null);
        //        });
        //    });
        //}
        //export function GetGracePeriodDate( key: string )
        //{
        //  var x = XHR.Get( "API/Dates/" + key );
        //  return new Promise( function ( resolve, reject )
        //  {
        //    x.then( function ( response )
        //    {
        //      var di = JSON.parse( response.Text );
        //      resolve( di );
        //    }).catch( function ()
        //    {
        //      console.log( "error in CheckContractorPermitStatus" );
        //      reject( null );
        //    });
        //  });
        //}
    })(transport = InspSched.transport || (InspSched.transport = {}));
})(InspSched || (InspSched = {}));
//# sourceMappingURL=transport.js.map