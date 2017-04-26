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
    var InspectionTypeSelect = document.getElementById("InspTypeSelect");
    var PermitSearchButton = document.getElementById("PermitSearchButton");
    var PermitSearchField = document.getElementById("PermitSearch");
    var permitNumSelect = document.getElementById("PermitSelect");
    var inspScheduler = document.getElementById("InspectionScheduler");
    var SaveInspectionButton = document.getElementById("SaveSchedule");
    var IssuesDiv = document.getElementById('NotScheduled');
    function start() {
        SaveInspectionButton.setAttribute("disabled", "disabled");
        LoadData();
        IssuesDiv.style.display = "none";
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
            if ($(dpCalendar).data('datepicker').getDate() != null) {
                SaveInspectionButton.removeAttribute("disabled");
            }
        };
        SaveInspectionButton.onclick = function () {
            var thisPermit = permitNumSelect.value;
            var thisInspCd = SaveInspectionButton.getAttribute("value");
            var IssuesDiv = document.getElementById('NotScheduled');
            IssuesDiv.style.display = "none";
            InspSched.UI.clearElement(IssuesDiv);
            InspSched.newInsp = new InspSched.NewInspection(thisPermit, thisInspCd, $(dpCalendar).data('datepicker').getDate());
            $(dpCalendar).data('datepicker').clearDates();
            console.log("In SaveInspection onchangedate: \"" + $(dpCalendar).data('datepicker').getDate() + "\"");
            InspSched.transport.SaveInspection(InspSched.newInsp).then(function (issues) {
                if (issues.length > 0) {
                    var thisHeading = document.createElement('h5');
                    thisHeading.innerText = "The following issue(s) prevented scheduling the requested inspection:";
                    thisHeading.className = "large-12 medium-12 small-12 row";
                    IssuesDiv.appendChild(thisHeading);
                    var IssueList = document.createElement('ul');
                    for (var i in issues) {
                        var thisIssue = document.createElement('li');
                        thisIssue.textContent = issues[i];
                        thisIssue.style.marginLeft = "2rem;";
                        console.log(issues[i]);
                        IssueList.appendChild(thisIssue);
                    }
                    IssuesDiv.appendChild(IssueList);
                    IssuesDiv.style.removeProperty("display");
                }
                // Will do something here when I am able to get this to my Controller
                return true;
            }, function () {
                console.log('error Saving Inspection');
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
            toggleActive: true,
        });
        {
            $(dpCalendar).on('changeDate', function () {
                var date = $(dpCalendar).data('datepicker').getDate();
                console.log("In calendar onchangedate: " + date);
                //return false;
                $('change-date').submit();
                EnableSaveButton();
            });
        }
        ;
        console.log;
    }
    function EnableSaveButton() {
        {
            if (InspectionTypeSelect.value != "" && $(dpCalendar).data('datepicker').getDate() != null) {
                SaveInspectionButton.removeAttribute("disabled");
            }
            else {
                SaveInspectionButton.setAttribute("disabled", "disabled");
            }
        }
    }
})(InspSched || (InspSched = {}));
//# sourceMappingURL=app.js.map