/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
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
        var SaveInspectionButton = document.getElementById("SaveSchedule");
        var PermitSearchButton = document.getElementById("PermitSearchButton");
        var PermitSearchField = document.getElementById("PermitSearch");
        var permitNumSelect = document.getElementById("PermitSelect");
        var inspScheduler = document.getElementById("InspectionScheduler");
        InspectionTypeSelect.onchange = function () {
            SaveInspectionButton.setAttribute("value", inspScheduler.getAttribute("value") + "/" + InspectionTypeSelect.value + "/");
            SaveInspectionButton.removeAttribute("disabled");
        };
        permitNumSelect.onchange = function () {
            // TODO: Add code to check if there is a selected date;
            SaveInspectionButton.setAttribute("disabled", "disabled");
            InspSched.UI.GetInspList(permitNumSelect.value);
            $(dpCalendar.datepicker('clearDates'));
        };
        PermitSearchButton.onclick = function () {
            InspSched.UI.Search(PermitSearchField.value);
        };
    }
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
            //let datesDisabled: string = "[";
            //let minDate: Dates = dates[0];
            //if (dates.length > 2)
            //{
            //  for (let i: number = 1; (i < dates.length - 2); i++)
            //  {
            //    datesDisabled += dates[i] + ", ";
            //  }
            //  datesDisabled += dates[dates.length - 2] + "]";
            //}
            //else
            //  datesDisabled += "]";
            //let maxDate: Dates = dates[dates.length - 1];
            //return dates;
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
        //if ( InspSched.firstDay == null )
        //{
        //  FirstAvailableDate.setDate( FirstAvailableDate.getDate() + 1 );
        //}
        //else
        //{
        //  let FirstAvailableDate = InspSched.firstDay;
        //}
        //let
        var first = '4/1/2017';
        dpCalendar = $('#sandbox-container div').datepicker({
            startDate: InspSched.firstDay,
            datesDisabled: additionalDisabledDates,
            endDate: InspSched.lastDay,
            maxViewMode: 0,
        });
        console.log;
    }
    //export function toggleNavDisplay(element: string): void
    //{
    //  UI.toggleNav("navTopMenu", element);
    //  let section = document.getElementsByTagName("section");
    //  for (var i = 0; i < section.length; i++)
    //  {
    //    if (section[i].style.display !== "none")
    //    {
    //      section[i].style.display = "none";
    //    }
    //  }
    //  document.getElementById(element).style.display = "block";
    //}
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map