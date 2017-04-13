/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />



namespace InspSched {
    "use strict";

    export let dpCalendar = null;

    export function start(): void
    {
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