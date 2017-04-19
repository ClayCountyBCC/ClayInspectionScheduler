/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="Inspection.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/foundation/foundation.d.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />

namespace InspSched
{
  "use strict";

  let dpCalendar = null;
  export let InspectionDates: Array<string> = [];
  export let InspectionTypes: Array<InspType> = [];
  export let firstDay: string;
  export let lastDay: string;


  export function start(): void
  {
    LoadData();

    var InspectionTypeSelect = <HTMLSelectElement>document.getElementById("InspTypeSelect");
    var SaveInspectionButton = document.getElementById("SaveSchedule");
    var PermitSearchButton = <HTMLButtonElement>document.getElementById( "PermitSearchButton" );
    var PermitSearchField = <HTMLInputElement>document.getElementById( "PermitSearch" );

    var permitNumSelect = <HTMLSelectElement>document.getElementById( "PermitSelect" );
    var inspScheduler = document.getElementById( "InspectionScheduler" );

    SaveInspectionButton.setAttribute( "disabled", "disabled" );

    PermitSearchButton.onclick = function ()
    {

      InspSched.UI.Search( PermitSearchField.value );
    }

    permitNumSelect.onchange = function ()
    {
      // TODO: Add code to check if there is a selected date;
      SaveInspectionButton.setAttribute( "disabled", "disabled" );
      InspSched.UI.GetInspList( permitNumSelect.value );
      $( dpCalendar.datepicker( 'clearDates' ) );

    }


    InspectionTypeSelect.onchange = function ()
    {
      SaveInspectionButton.setAttribute( "value", inspScheduler.getAttribute( "value" ) + "/" + InspectionTypeSelect.value + "/" );
      SaveInspectionButton.removeAttribute( "disabled" );
    }

    SaveInspectionButton.onclick = function ()
    {


      InspSched.UI.SaveInspection( );

    }



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
    let myDisabledDates: Array<string> = [];
    transport.GenerateDates().then(function (dates: Array<string>)
    {
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

  function GetAdditionalDisabledDates(dates: Array<string>): Array<string>
  {
    var AdditionalDisabledDates: Array<string> = [];
    if ( dates.length > 2 )
    {
      for ( let d: number = 1; d < dates.length - 1; d++ )
      {
        AdditionalDisabledDates.push(dates[d]);

      }

    }

    return AdditionalDisabledDates;
  }

  function BuildCalendar(dates: Array<string>)

  {
    $( document ).foundation();

    //
    let additionalDisabledDates: string []= GetAdditionalDisabledDates( dates );
    //if ( InspSched.firstDay == null )
    //{
    //  FirstAvailableDate.setDate( FirstAvailableDate.getDate() + 1 );
    //}
    //else
    //{
    //  let FirstAvailableDate = InspSched.firstDay;
    //}
    //let
    let first = '4/1/2017';
      dpCalendar = $( '#sandbox-container div' ).datepicker(
      <DatepickerOptions>
        {
          startDate: InspSched.firstDay,
          datesDisabled: additionalDisabledDates,
          endDate: InspSched.lastDay,
          maxViewMode: 0,

      });

      console.log
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