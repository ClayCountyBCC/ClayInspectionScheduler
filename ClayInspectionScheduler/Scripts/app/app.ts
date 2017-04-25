/// <reference path="transport.ts" />
/// <reference path="UI.ts" />
/// <reference path="Permit.ts" />
/// <reference path="dates.ts" />
/// <reference path="newinspection.ts" />
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
  export let newInsp: NewInspection;
 
  export function start(): void
  {
    LoadData();

    var InspectionTypeSelect = <HTMLSelectElement>document.getElementById("InspTypeSelect");
    var PermitSearchButton = <HTMLButtonElement>document.getElementById( "PermitSearchButton" );
    var PermitSearchField = <HTMLInputElement>document.getElementById( "PermitSearch" );
    var permitNumSelect = <HTMLSelectElement>document.getElementById( "PermitSelect" );
    var inspScheduler = document.getElementById( "InspectionScheduler" );
    var SaveInspectionButton = document.getElementById( "SaveSchedule" );
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
      SaveInspectionButton.setAttribute("value",  InspectionTypeSelect.value);
      SaveInspectionButton.removeAttribute( "disabled" );
    }

    SaveInspectionButton.onclick = function ()
    {
      let thisPermit: string = permitNumSelect.value;
      let thisInspCd: string = SaveInspectionButton.getAttribute( "value" );
      let thisDate: string = document.getElementById( "date" ).getAttribute( "value");

      
      newInsp = new NewInspection( thisPermit, thisInspCd, $( dpCalendar ).data( 'datepicker' ).getDate());
      
      console.log( "In SaveInspection onchangedate: \"" + $( dpCalendar ).data( 'datepicker' ).getDate() +"\"" );


      transport.SaveInspection( newInsp ).then( function ( isSaved: boolean )
      {
        // Will do something here when I am able to get this to my Controller
        return true;

      }, function ()
        {
          console.log( 'error getting inspections' );
          return false;
        });


    }

    


  } //  END start()
  
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

      dpCalendar = $( '#sandbox-container div' ).datepicker(
        <DatepickerOptions>
        {
          startDate: InspSched.firstDay,
          datesDisabled: additionalDisabledDates,
          endDate: InspSched.lastDay,
          maxViewMode: 0,
          toggleActive: true,
          
      })
      {
        $( dpCalendar ).on( 'changeDate', function ()
        {
          let date = $( dpCalendar).data('datepicker').getDate();
          console.log( "In calendar onchangedate: " + date );
          //return false;
          $( 'change-date' ).submit();

        });

      };
    

      console.log
  }

  function setDateValue( date: Date ): void
  {
    console.log( date );

  }

}