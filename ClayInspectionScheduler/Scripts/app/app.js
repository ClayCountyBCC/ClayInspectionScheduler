/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
var InspSched;
(function (InspSched) {
    "use strict";
    var dpCalendar = null;
    InspSched.InspectionDates = [];
    InspSched.InspectionTypes = [];
    function start() {
        LoadData();
        var InspectionTypeSelect = document.getElementById("InspTypeSelect");
        var PermitSearchButton = document.getElementById("PermitSearchButton");
        var PermitSearchField = document.getElementById("PermitSearch");
        var permitNumSelect = document.getElementById("PermitSelect");
        var inspScheduler = document.getElementById("InspectionScheduler");
        var SaveInspectionButton = document.getElementById("SaveSchedule");
        SaveInspectionButton.setAttribute("disabled", "disabled");
        PermitSearchButton.onclick = function () {
            InspSched.UI.Search(PermitSearchField.value);
        };
        permitNumSelect.onchange = function () {
            // TODO: Add code to check if there is a selected date;
            SaveInspectionButton.setAttribute("disabled", "disabled");
            InspSched.UI.GetInspList(permitNumSelect.value);
            $(dpCalendar.datepicker('clearDates'));
        };
        InspectionTypeSelect.onchange = function () {
            SaveInspectionButton.setAttribute("value", InspectionTypeSelect.value);
            SaveInspectionButton.removeAttribute("disabled");
        };
        SaveInspectionButton.onclick = function () {
            var thisPermit = permitNumSelect.value;
            var thisInspCd = SaveInspectionButton.getAttribute("value");
            InspSched.newInsp = new InspSched.NewInspection(thisPermit, thisInspCd, Date.parse("04/25/2017"));
            InspSched.transport.SaveInspection(InspSched.newInsp).then(function (isSaved) {
                // Will do something here when I am able to get this to my Controller
                return true;
            }, function () {
                console.log('error getting inspections');
                return false;
            });
        };
    } //  END start()
    InspSched.start = start;
    function LoadData() {
        LoadInspectionDates();
        LoadInspectionTypes();
    }
    function LoadInspectionTypes() {
        InspSched.transport.GetInspType().then(function (insptypes) {
            InspSched.InspectionTypes = insptypes;
            console.log('InspectionTypes', InspSched.InspectionTypes);
        }, function () {
            console.log('error in LoadInspectionTypes');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            //Hide('Searching');
            InspSched.InspectionTypes = [];
        });
    }
    function LoadInspectionDates() {
        var myDisabledDates = [];
        InspSched.transport.GenerateDates().then(function (dates) {
            InspSched.InspectionDates = dates;
            InspSched.firstDay = InspSched.InspectionDates[0];
            InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];
            BuildCalendar(dates);
            console.log('InspectionDates', InspSched.InspectionDates);
        }, function () {
            console.log('error in LoadInspectionDates');
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            //Hide('Searching');
            InspSched.InspectionDates = [];
        });
    }
    function GetAdditionalDisabledDates(dates) {
        var AdditionalDisabledDates = [];
        if (dates.length > 2) {
            for (var d = 1; d < dates.length - 1; d++) {
                AdditionalDisabledDates.push(dates[d]);
            }
        }
        return AdditionalDisabledDates;
    }
    function BuildCalendar(dates) {
        $(document).foundation();
        //
        var additionalDisabledDates = GetAdditionalDisabledDates(dates);
        dpCalendar = $('#sandbox-container div').datepicker({
            startDate: InspSched.firstDay,
            datesDisabled: additionalDisabledDates,
            endDate: InspSched.lastDay,
            maxViewMode: 0,
        });
        console.log;
    }
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map