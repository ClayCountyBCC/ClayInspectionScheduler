/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />



namespace InspSched
{
  "use strict";

  export let dpCalendar = null;
  export let InspectionDates = [];
  export let InspectionTypes = [];

  export function start(): void
  {
    LoadData();
    var typeSelect = <HTMLSelectElement>document.getElementById("InspTypeSelect");
    var saveButton = document.getElementById("SaveSchedule");
    var searchButton = document.getElementById("PermitSearch")

    var inspScheduler = document.getElementById("InspectionScheduler");
    typeSelect.onchange = function ()
    {
      saveButton.setAttribute("value", inspScheduler.getAttribute("value") + "/" + typeSelect.value + "/")
    }
    console.log("value changed to: " + this.value);

    $(document).foundation();

    dpCalendar = $('#sandbox-container div').datepicker(
      <DatepickerOptions>
      {
        maxViewMode: 0,
        toggleActive: true,
      });
  }

  function LoadData()
  {
    LoadInspectionDates();
    LoadInspectionTypes();
  }

  function LoadInspectionTypes()
  {
    transport.GetInspType().then(function (insptypes: Array<InspType>)
    {
      InspectionTypes = insptypes;
      console.log('InspectionTypes', InspectionTypes);
    },
      function ()
      {
        console.log('error in LoadInspectionTypes');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspectionTypes = [];
      });
  }

  function LoadInspectionDates()
  {
    transport.GenerateDates().then(function (dates: Array<Dates>)
    {
      InspectionDates = dates;
      console.log('InspectionDates', InspectionDates);
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

    },
      function ()
      {
        console.log('error in LoadInspectionDates');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        //Hide('Searching');
        InspectionDates = [];
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

}