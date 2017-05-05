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
    InspSched.GracePeriodDate = "";
    InspSched.CurrentPermits = [];
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
            //InspSched.UI.Search( PermitSearchField.value );
            InspSched.transport.GetPermit(PermitSearchField.value).then(function (permits) {
                InspSched.CurrentPermits = permits;
                InspSched.UI.ProcessResults(permits, PermitSearchField.value);
                return true;
            }, function () {
                console.log('error getting permits');
                // do something with the error here
                // need to figure out how to detect if something wasn't found
                // versus an error.
                InspSched.UI.Hide('Searching');
                return false;
            });
            console.log("PermitNo: " + PermitSearchField.value);
            if (PermitSearchField.value != "") {
                LoadInspectionDates();
            }
        };
        permitNumSelect.onchange = function () {
            // TODO: Add code to check if there is a selected date;
            SaveInspectionButton.setAttribute("disabled", "disabled");
            InspSched.UI.GetInspList(permitNumSelect.value);
            GetGracePeriodDate();
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
    function GetGracePeriodDate() {
        var checkString = (permitNumSelect.value == "" ? PermitSearchField.value : permitNumSelect.value);
        InspSched.transport.GetGracePeriodDate(checkString).then(function (GracePeriodDate) {
            var mydatestring = Date.parse(GracePeriodDate);
            var todaystring = Date.now();
            if (mydatestring != undefined && mydatestring < todaystring) {
                console.log("I should pass the permit number to the InspSched.UI.permitSchedulingIssue(permitNumSelect.value)");
                console.log("And I shouldn't run LoadInspectionDates");
            }
            else {
                LoadInspectionDates(GracePeriodDate[0]);
            }
        });
    }
    function LoadInspectionDates(GracePeriodDate) {
        InspSched.transport.GenerateDates().then(function (dates) {
            InspSched.InspectionDates = dates;
            InspSched.firstDay = InspSched.InspectionDates[0];
            InspSched.lastDay = InspSched.InspectionDates[dates.length - 1];
            var graceDate = new Date();
            graceDate.setDate(Date.parse(GracePeriodDate));
            if (GracePeriodDate != undefined && Date.parse(GracePeriodDate) < Date.parse(InspSched.lastDay)) {
                InspSched.lastDay = GracePeriodDate;
                console.log("GracePeriodDate: " + GracePeriodDate.toString());
            }
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
        $(dpCalendar).datepicker('destroy');
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