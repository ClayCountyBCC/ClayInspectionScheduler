/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
var InspSched;
(function (InspSched) {
    "use strict";
    InspSched.dpCalendar = null;
    InspSched.InspectionDates = [];
    InspSched.InspectionTypes = [];
    function start() {
        LoadData();
        var typeSelect = document.getElementById("InspTypeSelect");
        var saveButton = document.getElementById("SaveSchedule");
        var searchButton = document.getElementById("PermitSearch");
        var inspScheduler = document.getElementById("InspectionScheduler");
        typeSelect.onchange = function () {
            saveButton.setAttribute("value", inspScheduler.getAttribute("value") + "/" + typeSelect.value + "/");
        };
        console.log("value changed to: " + this.value);
        $(document).foundation();
        InspSched.dpCalendar = $('#sandbox-container div').datepicker({
            maxViewMode: 0,
            toggleActive: true,
        });
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
        InspSched.transport.GenerateDates().then(function (dates) {
            InspSched.InspectionDates = dates;
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