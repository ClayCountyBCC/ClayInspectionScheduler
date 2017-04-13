/// <reference path="Permit.ts" />
/// <reference path="Inspection.ts" />

namespace InspSched.UI
{

  "use strict"
  let PermitList: Array<Permit> = [];
  let CurrentPermits: Array<Permit> = [];
  let InspectionList: Array<Inspection> = [];
  let CurrentInspections: Array<Inspection> = [];
  let ContractorList: Array<Contractor> = [];
  let CurrentContractor: Array<Contractor> = [];
  let CurrentInspTypes: Array<InspType> = [];
  let InspTypeList: Array<InspType> = [];


  export function Search( key: string ): boolean
  {

    clearElement( document.getElementById( 'SearchFailed' ) );
    Hide( 'PermitSelectContainer' );
    Hide( 'CurrentPermitData' )
    Hide( 'InspectionScheduler' );
    Hide( 'CurrentPermit' )
    Hide( 'InspectionTable' );
    Show( 'Searching' );
    Hide( 'SearchFailed' );
    Hide( 'SuspendedContractor' );

    let k: string = key.trim().toUpperCase();
    document.getElementById( 'PermitSearch' ).setAttribute( "value", k );

    if ( k.length == 8 && !isNaN( Number( k ) ) )
    {
      GetPermitList( k );

    }
    else
    {
      Hide( 'Searching' );
      UpdateSearchFailed( key );

      return false;
    }
  }

  function ProcessResults( permits: Array<Permit>, key: string )
  {
    let tbl: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspectionTable' ) );


    AddPermit( permits, key );
    UpdatePermitData( key, permits );


    if ( permits.length == 0 ) 
    {
      UpdateSearchFailed( key );
    }
    else 
    {
      Hide( 'Searching' );
      document.getElementById( 'CurrentPermitData' ).style.display = "block";
      ShowTable( key, permits );

    }

  }

  /**********************************
    
    Build Option List
  
  **********************************/

  function GetPermitList( key: string, permit?: Permit )
  {

    transport.GetPermit( key ).then( function ( permits: Array<Permit> )
    {

      CurrentPermits = permits;
      ProcessResults( permits, key );

      return true;

    },
      function ()
      {

        console.log( 'error getting permits' );
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        Hide( 'Searching' );

        return false;
      });
  }

  function AddPermit( permits: Array<Permit>, key: string )
  {
    let container: HTMLElement = ( <HTMLElement>document.getElementById( 'PermitSelect' ) );
    clearElement( container );

    let current = buildPermitSelectOptGroup( "Search Results", "current" );
    let related = buildPermitSelectOptGroup( "Related Permits", "related" );
    container.appendChild( current );
    if ( permits.length > 1 )
    {
      container.appendChild( related );
    }


    for ( let permit of permits )
    {
      if ( permit.PermitNo == key )
      {
        current.appendChild( buildPermitSelectOption( permit, key ) );
        GetInspList( key, permit );

      }
      else
      {
        if ( permits.length > 1 )
          related.appendChild( buildPermitSelectOption( permit, key ) );
      }
    }



  }

  export function UpdatePermitData( key: string, permits?: Array<Permit> ): void
  {
    Hide( '' )
    let street: HTMLElement = ( <HTMLElement>document.getElementById( 'ProjAddrCombined' ) );
    let city: HTMLElement = ( <HTMLElement>document.getElementById( 'ProjCity' ) );


    for ( let permit of permits )
    {
      if ( permit.PermitNo == key ) 
      {
        Show( 'PermitSelectContainer' );
        street.innerHTML = permit.ProjAddrCombined.trim();
        city.innerHTML = permit.ProjCity.trim();
        break;
      }


    }


  }

  function buildPermitSelectOptGroup( lbl: string, val: string ): HTMLElement
  {
    //let og = document.createElement( "optgroup" );
    let og = document.createElement( "optgroup" );
    og.label = lbl;
    og.value = val;

    return og;
  }

  function createOptGroupElement( value: string, className?: string ): HTMLElement
  {
    let og = document.createElement( "optgroup" );
    if ( className !== undefined )
    {
      og.className = className;

    }

    og.label = value;
    og.appendChild( document.createTextNode( value ) );
    return og;
  }

  function buildPermitSelectOption( permit: Permit, key: string ): HTMLElement
  {

    let option: HTMLOptionElement = ( <HTMLOptionElement>document.createElement( "option" ) );

    option.setAttribute( "value", permit.PermitNo.trim() );
    option.setAttribute( "label", permit.PermitNo + "  (" + permit.PermitTypeDisplay + ")" );
    option.setAttribute( "title", permit.PermitNo.trim() );
    option.textContent = permit.PermitNo + "  (" + permit.PermitTypeDisplay + ")";

    option.id = permit.PermitNo + permit.CanSchedule;

    if ( permit.PermitNo == key )
    {

      option.value = permit.PermitNo.trim();
      option.selected = true;
    }
    else
    {
      option.value = permit.PermitNo.trim();
      option.selected = false;
    }
    return option;
  }

  /**********************************

  Initial build:
    list is filled during search
    ProcessResults() calls GetInspList()

  Updating the Inspection List:
    select element: 'PermitSelect' will \
    trigger onchange event calling
    UpdateInspList()
  
  ***********************************/

  export function GetInspList( key: string, permit?: Permit )
  {
    document.getElementById( 'InspectionScheduler' ).removeAttribute( "value" );
    var saveButton: HTMLElement = ( <HTMLElement>document.getElementById( 'SaveSchedule' ) );
    if ( saveButton != undefined )
      saveButton.removeAttribute( "value" );


    let completed: number = 0;
    let canSchedule: boolean = true;
    Hide( 'InspSched' );
    Hide( 'InspListHeader' );
    Hide( 'InspListData' );
    Hide( 'InspectionScheduler' );
    Hide( 'SuspendedContractor' );
    document.getElementById( 'FutureInspRow' ).removeAttribute( "value" );



    clearElement( document.getElementById( 'InspListData' ) );
    //clearElement( document.getElementById( 'InspectionType' ) );

    transport.GetInspections( key ).then( function ( inspections: Array<Inspection> )
    {

      if ( inspections.length > 0 )
      {
        
        CurrentInspections = inspections;
        BuildInspectionList( inspections, permit );

      }
      else
      {

        BuildScheduler( inspections, canSchedule, completed, key );
        document.getElementById( 'PermitScreen' ).style.display = "flex";

      }

      return true;

    }, function ()
      {
        console.log( 'error getting inspections' );
        return false;
      });

  }

  export function BuildInspectionList( inspections: Array<Inspection>, permit?: Permit )
  {
    let completed: number = 0;
    let NumFutureInsp: number = 0;

    let canSchedule: boolean = true;
    // Initialize element variable for list container 'InspListData'
    let InspList: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspListData' ) );
    let InspHeader: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspListHeader' ) );
    let empty: HTMLElement = ( <HTMLElement>document.createElement( "tr" ) );
    clearElement( document.getElementById('FutureInspRow') );


    // TODO: add Try/Catch
    if ( inspections.length > 0 )
    {
      // create (call BuildInspectioN()) and add inspection row to container InspList
      for ( let inspection of inspections )
      {
        if ( inspection.ResultADC )
        {
          if ( completed < 5 )
          { 
            InspList.appendChild( BuildCompletedInspection( inspection ) );
            completed++;
          }      
        }
        else if ( !inspection.ResultADC )
        {

          NumFutureInsp++;
          BuildFutureInspRow( inspection, NumFutureInsp );
          
        }

      }

      if ( NumFutureInsp )
      {
        document.getElementById( 'FutureInspRow' ).setAttribute( "value", inspections[0].PermitNo );
      }

      if ( completed > 0 )
      {
        InspHeader.style.removeProperty( "display" );
        InspList.style.removeProperty( "display" );

      }

      document.getElementById( 'PermitScreen' ).style.display = "flex";
    }
    else
    {

      // Display error: no Inspections

    }


    BuildScheduler( inspections, canSchedule, completed );

  }

  function BuildCompletedInspection( inspection: Inspection )
  {

    let inspRow: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspRow.className = "row large-12";
    let inspDateTime: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspDateTime.textContent = inspection.DisplayInspDateTime.trim();
    inspDateTime.className = "large-3 medium-2 small-12 inspDate ";
    inspRow.appendChild( inspDateTime );

    let inspDesc: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    inspDesc.textContent = inspection.InsDesc.trim();
    inspDesc.className = "large-8 medium-8 small-9 inspType ";
    inspRow.appendChild( inspDesc );

    let ResultADC: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    ResultADC.textContent = inspection.ResultADC.trim();
    ResultADC.className = "large-1 medium-1 small-1 inspResult";
    ResultADC.style.textAlign = "center";
    inspRow.appendChild( ResultADC );

    inspRow.appendChild( document.createElement( "hr" ) );

    if ( inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'C' || inspection.ResultADC == 'N' )
    {

      //TODO: Create overlay to show remarks from failed inspection

    }


    return inspRow;
  }

  function BuildFutureInspRow( inspection: Inspection, numFutureInsp: number )
  {


    let schedBody: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'InspSchedBody' ) );
    let futureRow: HTMLDivElement = ( <HTMLDivElement>document.getElementById( 'FutureInspRow' ) );
    let thisinsp: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let dateName: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspDate: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspType: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspInspector: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspCancelDiv: HTMLDivElement = ( <HTMLDivElement>document.createElement( "div" ) );
    let thisinspCancelButton: HTMLButtonElement = ( <HTMLButtonElement>document.createElement( "button" ) );

    thisinsp.setAttribute( "id", inspection.InspReqID + "_" + numFutureInsp );

    thisinsp.className = "InspBorderBottom large-12 medium-12 small-12 row";

    thisinspDate.className = "large-2 medium-2 small-4 column align-center column";
    thisinspType.className = "large-5 medium-4 small-8 column align-center column ";           
    thisinspInspector.className = "large-3 medium-4 hide-for-small-only end column align-center";

    thisinspCancelDiv.className = "large-2 medium-2 small-12 column flex-container align-center";
    thisinspCancelButton.className = " button";
    
    thisinspDate.innerText = inspection.DisplaySchedDateTime;
    thisinspType.innerText = inspection.InsDesc;
    thisinspInspector.innerText = inspection.InspectorName;
    thisinspCancelButton.innerText = "Cancel";

    document.getElementById( 'InspSched' ).style.removeProperty( "display" );
    document.getElementById( 'FutureInspRow' ).style.removeProperty( "display" );

    

    thisinspCancelButton.setAttribute( "onclick", "( InspSched.UI.CancelInspection(\"" + inspection.InspReqID + "\", \"" + inspection.PermitNo + "\" ) )" );
    //thisinspCancelButton.setAttribute( "type", "button" );
    thisinspCancelDiv.appendChild( thisinspCancelButton );


    thisinsp.appendChild( thisinspDate );
    thisinsp.appendChild( thisinspType );
    thisinsp.appendChild( thisinspInspector );

    thisinsp.appendChild( thisinspCancelDiv );

    futureRow.appendChild( thisinsp );

    schedBody.style.removeProperty( "display" );

  }

  /**********************************************
   *
   * Build Scheduler
   * Get and build select list of inspections@
   * 
   *********************************************/

  function BuildScheduler( inspections: Array<Inspection>, canSchedule: boolean, completed: number, key?: string)
  {
    
    if ( inspections.length > 0)
      key = inspections[0].PermitNo;
      
    if ( canSchedule )
    {
      
      transport.CheckContractorPermitStatus( key ).then( function ( contractors: Array<Contractor> )
      {
        CurrentContractor = contractors;
        let fail: HTMLElement = ( <HTMLElement>document.getElementById( key + "FAIL" ) );
        let pass: HTMLElement = ( <HTMLElement>document.getElementById( key+ "PASS" ) );

        // if contractor IS ALLOWED to schedule, the contractor id will be on the list
        if ( CurrentContractor.length > 0 && pass )
        {

          // Populate Inspection Type Select list
          GetInspType( key );

          //BuildSchdeuleCalendar();
          document.getElementById( 'InspectionScheduler' ).style.removeProperty( "display" );
          document.getElementById( 'InspectionScheduler' ).setAttribute( "value", key );

        }

        // if contractor IS NOT ALLOWED to schedule inspection, the list will be empty
        else if ( CurrentContractor.length <= 0 || fail )
        {
          // TODO Add code to display suspended contractor

          let e: HTMLElement = document.getElementById( 'SuspendedPermit' );
          clearElement( e );
          let message: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( "h5" ) );
          message.appendChild( document.createTextNode( "A new inspection cannot be scheduled for permit #" + key + "." ) );
          message.appendChild( document.createElement( "br" ) );
          message.appendChild( document.createElement( "br" ) );
          message.appendChild( document.createTextNode( 

            "\nIf you are unable to schedule your inspection " +
            "through this site please call the Building Department " +
            "for assistance at 904-284-6307.  Inspections may not " +
            "be able to be scheduled on line due to many reasons " +
            "(fees due, permit problems, holds, or licensing issues)."
          
          ) );

          e.appendChild( message );
          document.getElementById( 'SuspendedContractor' ).style.removeProperty( "display" );


        }
        return true

      }, function ()
        {
          console.log( 'error in Scheduler' );
          return false;

        });


    }

  }

  export function BuildScheduleCalendar()
  {

    //transport.GenerateDates().then( function ( dates: Array<Dates> ): Array<Dates>
    //{
    //  let datesDisabled: string = "[";

    //  let minDate: Dates = dates[0];

    //  if ( dates.length > 2 )
    //  {
    //    for ( let i: number = 1; ( i < dates.length - 2 ); i++ )
    //    {
    //      datesDisabled += dates[i] + ", ";
    //    }
    //    datesDisabled += dates[dates.length - 2] + "]";
    //  }
    //  else
    //    datesDisabled += "]";

    //  let maxDate: Dates = dates[dates.length - 1];



    //  return dates;
    //},
    //  function ()
    //  {

    //    console.log( 'error in generateDates' );
    //    // do something with the error here
    //    // need to figure out how to detect if something wasn't found
    //    // versus an error.
    //    Hide( 'Searching' );

    //    return null;
    //  });


    //let element: HTMLScriptElement = ( <HTMLScriptElement>document.getElementById( 'CalendarScriptLocation' ) );
    //clearElement( element );
    
  }

  function GetInspType(key: string)
  {

    let thistype: string = key[0];

    let InspTypeList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById('InspTypeSelect'));
    let optionLabel: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    clearElement(InspTypeList);

    switch (thistype)
    {
      case '1':
      case '0':
      case '9':
        optionLabel.label = "Building";
        thistype = "1";
        break;
      case '2':
        optionLabel.label = "Electrical";
        break;
      case '3':
        optionLabel.label = "Plumbing";
        break;
      case '4':
        optionLabel.label = "Mechanical";
        break;
      case '6':
        optionLabel.label = "Fire";
        break;

    }

    optionLabel.label += " Inspections:";
    optionLabel.innerText = optionLabel.label;
    optionLabel.className = "selectPlaceholder";
    optionLabel.selected;
    optionLabel.value = "";
    InspTypeList.appendChild(optionLabel);

    for (let type of InspectionTypes)
    {
      if (type.InspCd[0] == thistype)
      {
        let option: HTMLOptionElement = <HTMLOptionElement>document.createElement("option");        
        option.label = type.InsDesc;
        option.value = type.InspCd;
        option.className = "TypeSelectOption";
        InspTypeList.appendChild(option);
        option.innerText = type.InsDesc;
      }
    }
    //transport.GetInspType().then( function ( insptypes: Array<InspType> )
    //{
    //  CurrentInspTypes = insptypes;
    //  for ( let type of insptypes )
    //  {
    //    if ( type.InspCd[0] == thistype )
    //    {
    //      let option = document.createElement( "option" );
    //      option.label = type.InsDesc;
    //      option.value = type.InspCd;
    //      option.className = "TypeSelectOption";
    //      InspTypeList.appendChild( option );
    //      option.innerText = type.InsDesc;

    //    }
    //  }

    //  InspTypeList.required;

    //  return true;
    //},
    //  function ()
    //  {
    //    console.log( 'error getting inspection types' );
    //    return false;

    //  });


  }

  /**********************************
  
    Do Somethings
  
  ***********************************/

  function createNewElement( elementType: string, classname?: string, value?: string, id?: string ): HTMLElement
  {
    let element = document.createElement( elementType );


    if ( classname !== undefined )
      element.className = classname;
    else
      element.className = "";


    if ( value !== undefined )
      element.nodeValue = value;
    else
      element.nodeValue = "";


    if ( id !== undefined )
      element.id = id;
    else
      element.id = "";

    element.appendChild( document.createTextNode( value ) );

    return element;
  }

  function Show( id?: string, element?: HTMLElement, displayType?: string ): void
  {
    if ( !element )
    {
      let e = document.getElementById( id );
      if ( displayType == null )
        e.style.display = "block";
      else
        e.style.display = displayType;
    }
    else
    {
      let e = document.getElementById( id );
      if ( displayType == null )
        element.style.display = "block";
      else
        element.style.display = displayType;
    }
  }

  function Hide( id: string ): void
  {

    let e = document.getElementById( id );
    if ( e )
      e.style.display = "none";
  }

  // this function emptys an element of all its child nodes.
  export function clearElement( node: HTMLElement ): void
  {
    while ( node.firstChild )
    {
      node.removeChild( node.firstChild );
    }
  }

  function ShowTable( key: string, permits?: Array<Permit> )
  {
    let inspectionTable: HTMLTableElement = ( <HTMLTableElement>document.getElementById( 'InspectionTable' ) );
    if ( permits )
    {
      Hide( 'Searching' );
      inspectionTable.style.removeProperty( "display" );

    }
  }

  function UpdateSearchFailed( key: string ): void
  {

    let e: HTMLElement = document.getElementById( 'SearchFailed' );
    clearElement( e );
    let message: HTMLHeadingElement = ( <HTMLHeadingElement>document.createElement( "h3" ) );

    if ( !isNaN( Number( key ) ) && key.length == 8 )
    {
      message.appendChild( document.createTextNode( "Permit #" + key + " not found" ) );
    }
    else if ( !isNaN( Number( key ) ) && key.length != 8 )
    {
      message.innerHTML = "You did not enter any information.<br />Enter a valid permit number to search.";

    }
    else if ( key.length == 0 )
    {
      message.innerHTML = key + " is not a valid Permit Number";

    }
    else
    {
      message.innerHTML = "Invalid Entry<br />";
    }
    e.appendChild( message );

    Hide( 'Searching' );
    Show( 'SearchFailed' );
  }

  export function CancelInspection( InspID?: string, key?: string )
  {
    if ( InspID && key )
    {
      //Hide( 'FutureInspRow' );
      // TODO: Add function to not allow cancel if scheduled date of insp is current date 

      var isDeleted = transport.CancelInspection(InspID, key );

      // TODO: ADD code to inform user if the inspection has been deleted 

      // Reload inspection list after delete
      if ( isDeleted )
      {
        GetInspList( key );
      }

      else
      {
        //display notification of failed delete

      }
    }
    else
    {
      console.log( "There is no scheduled inspection to cancel" );
      document.getElementById( 'InspSched' ).style.display = "none";
    }
  }

  export function SaveInspection( PermitNo: string, InspCd: string, date: Date )
  {
    
    
    transport.SaveInspection( PermitNo, InspCd, date).then( function ( isSaved: boolean )
    {

      return true;
    }, function ()
      {
        console.log( "Error in SaveInspection" );

        //GetInspType( PermitNo );
      });
  }

}