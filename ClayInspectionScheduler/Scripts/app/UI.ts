/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />



namespace InspSched.UI
{
  "use strict";
  export let CurrentPermits: Array<Permit> = new Array<Permit>();
  export let CurrentInspections: Array<Inspection> = [];

  export function Search(key: string)
  {
    clearElement(document.getElementById('SearchFailed'));
    Hide('PermitSelectContainer');
    Hide('CurrentPermitData')
    Hide('InspectionScheduler');
    Hide('CurrentPermit')
    Hide('InspectionTable');
    Show('Searching');
    Hide('SearchFailed');
    Hide('SuspendedContractor');

    let k: string = key.trim().toUpperCase();
    document.getElementById('PermitSearch').setAttribute("value", k);

    if (k.length == 8 && !isNaN(Number(k)))
    {
      return k;
    }
    else
    {
      Hide('Searching');

      UpdateSearchFailed(key);

      return null;
    }
  }

  export function ProcessResults(permits: Array<Permit>, key: string)
  {
    let tbl: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspectionTable'));
    AddPermit(permits, key);
    UpdatePermitData(key, permits);

    if (permits.length == 0) 
    {
      UpdateSearchFailed(key);
    }
    else 
    {
      Hide('Searching');
      document.getElementById('CurrentPermitData').style.display = "block";
      ShowTable(key, permits);

    }
  }

  /**********************************
    
    Build Option List
  
  **********************************/

  function GetPermitList(key: string, permit?: Permit)
  {

    transport.GetPermit(key).then(function (permits: Array<Permit>)
    {

      CurrentPermits = permits;
      InspSched.CurrentPermits = permits
      ProcessResults(permits, key);

      return true;

    },
      function ()
      {
        console.log('error in GetPermits');
        // do something with the error here
        // need to figure out how to detect if something wasn't found
        // versus an error.
        Hide('Searching');

        return false;
      });
  }

  function AddPermit(permits: Array<Permit>, key: string)
  {
    let container: HTMLElement = (<HTMLElement>document.getElementById('PermitSelect'));
    clearElement(container);

    let current = buildPermitSelectOptGroup("Search Results", "current");
    let related = buildPermitSelectOptGroup("Related Permits", "related");
    container.appendChild(current);
    if (permits.length > 1)
    {
      container.appendChild(related);
    }

    for (let permit of permits)
    {
      if (permit.PermitNo == key)
      {
        current.appendChild(buildPermitSelectOption(permit, key));
        GetInspList(key, permit);

      }
      else
      {
        if (permits.length > 1)
          related.appendChild(buildPermitSelectOption(permit, key));
      }
    }
  }

  export function UpdatePermitData(key: string, permits?: Array<Permit>): void
  {

    let street: HTMLElement = (<HTMLElement>document.getElementById('ProjAddrCombined'));
    let city: HTMLElement = (<HTMLElement>document.getElementById('ProjCity'));

    for (let permit of permits)
    {
      if (permit.PermitNo == key) 
      {
        Show('PermitSelectContainer');
        street.innerHTML = permit.ProjAddrCombined.trim();
        city.innerHTML = permit.ProjCity.trim();
        break;
      }
    }
  }

  function buildPermitSelectOptGroup(lbl: string, val: string): HTMLElement
  {
    //let og = document.createElement( "optgroup" );
    let og = document.createElement("optgroup");
    og.label = lbl;
    og.value = val;

    return og;
  }

  function createOptGroupElement(value: string, className?: string): HTMLElement
  {
    let og = document.createElement("optgroup");
    if (className !== undefined)
    {
      og.className = className;

    }

    og.label = value;
    og.appendChild(document.createTextNode(value));
    return og;
  }

  function buildPermitSelectOption(permit: Permit, key: string): HTMLElement
  {

    let label: string = getInspTypeString(permit.PermitNo[0]);
    let option: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    option.setAttribute("value", permit.PermitNo.trim());
    option.setAttribute("label", permit.PermitNo + "  (" + label + ")");
    option.setAttribute("title", permit.PermitNo.trim());
    option.textContent = permit.PermitNo + "  (" + label + ")";

    option.id = "select_" + permit.PermitNo;

    if (permit.PermitNo == key)
    {

      option.value = permit.PermitNo.trim();
      option.selected = true;
    }
    else
    {
      option.value = permit.PermitNo.trim();
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

  export function GetInspList(key: string, permit?: Permit)
  {
    document.getElementById('InspectionScheduler').removeAttribute("value");
    var saveButton: HTMLElement = (<HTMLElement>document.getElementById('SaveSchedule'));
    if (saveButton != undefined)
    {
      saveButton.setAttribute("disabled", "disabled");
      saveButton.removeAttribute("value");
    }
    let completed: number = 0;
    let canSchedule: boolean = true;
    Hide('InspSched');
    Hide('InspListHeader');
    Hide('InspListData');
    Hide('InspectionScheduler');
    Hide('SuspendedContractor');
    clearElement(document.getElementById('InspListData'));

    transport.GetInspections(key).then(function (inspections: Array<Inspection>)
    {
      if (inspections.length > 0)
      {
        InspSched.CurrentInspections = inspections;
        BuildInspectionList(InspSched.CurrentInspections, permit);
        BuildScheduler(InspSched.CurrentInspections ,key);

      }
      else
      {
        // TODO: add 'NO INSPECTIONS ERROR'
        //document.getElementById('PermitScreen').style.display = "flex";
      }


      return true;
    }, function ()
      {
        console.log('error getting inspections');
        return false;
      });
  }

  export function BuildInspectionList(inspections: Array<Inspection>, permit?: Permit)
  {
    let completed: number = 0;
    let NumFutureInsp: number = 0;

    // Initialize element variable for list container 'InspListData'
    let InspList: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspListData'));
    let InspHeader: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspListHeader'));
    let empty: HTMLElement = (<HTMLElement>document.createElement("tr"));

    // TODO: add Try/Catch

    // create (call BuildInspectioN()) and add inspection row to container InspList
    for (let inspection of inspections)
    {
      if (inspection.ResultADC)
      {
        InspList.appendChild(BuildCompletedInspection(inspection));
        completed++;
      }
      else if (!inspection.ResultADC)
      {
        InspList.appendChild(BuildFutureInspRow(inspection, NumFutureInsp, InspSched.ThisPermit.IsExternalUser));
      }

    }

    InspList.style.removeProperty("display");
    document.getElementById("InspSched").style.removeProperty("display");
    document.getElementById('PermitScreen').style.display = "flex";

    var passedFinal = false;
    if (passedFinal)
    {
      //TODO: Update passed final issue
    }
  }

  function BuildCompletedInspection(inspection: Inspection)
  {
    let ShowCreateNewInsp: HTMLDivElement = (<HTMLDivElement>document.getElementById("CreateNew_" + inspection.PermitNo));
    let thisInspPermit: Permit;
    let inspRow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
    else if (inspection.ResultADC == null || inspection.ResultADC == "")
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
    else if (inspection.ResultADC == 'C')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow"
    else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";


    
    let dataColumn: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    dataColumn.className = "large-10 medium-10 small-12 ";

    let thisPermit: HTMLDivElement = (<HTMLDivElement>document.createElement('div'));
    thisPermit.innerText = inspection.PermitNo;
    thisPermit.className = "large-2 meduim-6 small-6 column InspPermit ";
    dataColumn.appendChild(thisPermit);

    let inspDateTime: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspDateTime.textContent = inspection.DisplayInspDateTime.trim();
    inspDateTime.className = "large-2 medium-5 small-6 column  InspDate";
    dataColumn.appendChild(inspDateTime);

    let inspDesc: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspDesc.textContent = inspection.InsDesc.trim();
    inspDesc.className = "large-5 medium-6 small-6  InspType column  ";
    dataColumn.appendChild(inspDesc);

    let ResultADC: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    ResultADC.textContent = inspection.ResultDescription.trim();
    ResultADC.className = "large-3 medium-5 small-6 InspResult column end";

    dataColumn.appendChild(ResultADC);


    let NewInspButtonDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    NewInspButtonDiv.className = "large-2 medium-2 small-12  flex-container align-center ";

    if (ShowCreateNewInsp==null)
    {
      for (let p of InspSched.CurrentPermits)
      {
        if (p.PermitNo === inspection.PermitNo)
        {
          thisInspPermit = p;
          break;
        }
      }

      if (thisInspPermit.ErrorText == null)
      {
        let NewInspButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
        NewInspButton.className = "align-self-center myButton small-12 NewInspButton";
        NewInspButton.innerText = "New";
        NewInspButton.value = inspection.PermitNo;
        NewInspButton.setAttribute("onclick",

        "InspSched.UpdatePermitSelectList(this.value);"

        );


        NewInspButton.id = "CreateNew_" + inspection.PermitNo;

        NewInspButtonDiv.appendChild(NewInspButton);
      }
    }

    inspRow.appendChild(dataColumn);
    inspRow.appendChild(NewInspButtonDiv);

    if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
    {
      let Remarks: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));

      if (inspection.Remarks !== null || inspection.Remarks === "")
      {
        Remarks.textContent = "Remarks: " + inspection.Remarks.trim();

      }
      else
      {
        Remarks.textContent = "No remarks entered by the inspector. Please contact the Building Department " +
          "at 904-284-6307 or contact the inspector " +
          "directly for assistance.";
      }

      Remarks.className = "large-12 medium-12 small-12 inspRemarks";
      inspRow.appendChild(Remarks);
    }

    return inspRow;
  }

  function BuildFutureInspRow(inspection: Inspection, numFutureInsp: number, IsExternalUser: boolean)
  {
    let schedBody: HTMLDivElement = (<HTMLDivElement>document.getElementById('InspSchedBody'));

    let thisinsp: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    thisinsp.setAttribute("id", inspection.InspReqID + "_" + numFutureInsp);
    thisinsp.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";

    let thisPermit: HTMLDivElement = (<HTMLDivElement>document.createElement('div'));
    thisPermit.innerText = inspection.PermitNo;
    thisPermit.className = "large-2 meduim-6 small-6 column InspPermit";

    let thisinspDate: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    thisinspDate.className = "large-2 medium-5 small-6 column InspDate ";
    thisinspDate.innerText = inspection.DisplaySchedDateTime;


    let thisinspType: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    thisinspType.className = "large-5 medium-6 small-12 column InspType";
    thisinspType.innerText = inspection.InsDesc 

    let thisinspInspector: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    thisinspInspector.className = "large-3 medium-5  hide-for-small-only column InspInspector";
    thisinspInspector.innerText = inspection.InspectorName;
    thisinspInspector.setAttribute("style", "float:left;");

    let thisinspCancelDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    thisinspCancelDiv.className = "large-2 medium-2 small-12  flex-container align-center";

    let thisinspCancelButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
    thisinspCancelButton.className = "align-self-center myButton small-12 NewInspButton";
    thisinspCancelButton.innerText = "Cancel";
    thisinspCancelButton.value = inspection.PermitNo;
    thisinspCancelButton.setAttribute("onclick",
    // cancels inspection then re-fetch inspections
    "InspSched.CancelInspection('" + inspection.InspReqID + "', '" + inspection.PermitNo + "');");

    // Display cancel button if good date
    if (IsGoodCancelDate(inspection, IsExternalUser))
      thisinspCancelDiv.appendChild(thisinspCancelButton);

    let dataColumn: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    dataColumn.className = "large-10 medium-10 small-12";

    dataColumn.appendChild(thisPermit);
    dataColumn.appendChild(thisinspDate);
    dataColumn.appendChild(thisinspType);
    dataColumn.appendChild(thisinspInspector);


    thisinsp.appendChild(dataColumn);
    thisinsp.appendChild(thisinspCancelDiv);

    return thisinsp;

  }

  /**********************************************
   *
   * Build Scheduler
   * Get and build select list of inspections@
   * 
   *********************************************/

  export function BuildScheduler(inspections: Array<Inspection>, key: string)
  {
    
    // Populate Inspection Type Select list
    for (var permit of InspSched.CurrentPermits)
    {
        console.log(permit.PermitNo);

    }
    LoadInspTypeSelect(key);

    document.getElementById('InspectionScheduler').setAttribute("value", key);
      
    //permitSchedulingIssue(key);
  }

  export function LoadInspTypeSelect(key: string)
  {
    let thistype: string = key[0];
    var label: string = getInspTypeString(thistype);

    let InspTypeList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById('InspTypeSelect'));
    let optionLabel: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    clearElement(InspTypeList);
    optionLabel.textContent = label + " Inspections:";
    //optionLabel.label += label +" Inspections:";
    //optionLabel.innerText = optionLabel.label;
    optionLabel.className = "selectPlaceholder";
    optionLabel.selected;
    optionLabel.value = "";
    InspTypeList.appendChild(optionLabel);

    for (let type of InspSched.InspectionTypes)
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
  }

  /**********************************
  
    Do Somethings
  
  ***********************************/
  function getInspTypeString(InspType: string)
  {
    switch (InspType)
    {
      case "1":
      case "0":
      case "9":
        return "Building";
      case "2":
        return "Electrical";
      case "3":
        return "Plumbing";
      case "4":
        return "Mechanical";
      case "6":
        return "Fire";
      default:
        return "Unknown"
    }
  }

  export function Show(id?: string, element?: HTMLElement, displayType?: string): void
  {
    if (!element)
    {
      let e = document.getElementById(id);
      if (e.style.display != null)
      {
        if (displayType == null)
          e.style.display = "block";
        else
          e.style.display = displayType;
      }
    }
    else
    {
      let e = document.getElementById(id);
      if (displayType == null)
        element.style.display = "block";
      else
        element.style.display = displayType;
    }
  }

  export function Hide(id: string): void
  {

    let e = document.getElementById(id);
    if (e)
      e.style.display = "none";
  }

  // this function emptys an element of all its child nodes.
  export function clearElement(node: HTMLElement): void
  {
    while (node.firstChild)
    {
      node.removeChild(node.firstChild);
    }
  }

  function ShowTable(key: string, permits?: Array<Permit>)
  {
    let inspectionTable: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspectionTable'));
    if (permits)
    {
      Hide('Searching');
      inspectionTable.style.removeProperty("display");

    }
  }

  function UpdateSearchFailed(key: string): void
  {

    let e: HTMLElement = document.getElementById('SearchFailed');
    clearElement(e);
    let message: HTMLHeadingElement = (<HTMLHeadingElement>document.createElement("h3"));

    if (!isNaN(Number(key)) && key.length == 8)
    {
      message.appendChild(document.createTextNode("Permit #" + key + " not found"));
    }
    else if (!isNaN(Number(key)) && key.length > 0 && key.length != 8)
    {
      message.innerHTML = "\"" + key + "\" is not a valid Permit Number";

    }
    else if (key.length == 0)
    {
      message.innerHTML = "You did not enter any information.<br />Enter a valid permit number and click search.";

    }
    else
    {
      message.innerHTML = "Invalid Entry<br />";
    }
    message.style.textAlign = "center";
    e.appendChild(message);

    Hide('Searching');
    Show('SearchFailed');
  }

  export function InformUserOfError(permitno: string, error: string): void
  {

    document.getElementById("InspectionScheduler").style.display = "none";
    clearElement(document.getElementById('InspTypeSelect'));

    let reasons: HTMLDivElement = (<HTMLDivElement>document.getElementById('Reasons'));
    clearElement(reasons);
    let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
    clearElement(thisHeading);

    let IssueList: HTMLUListElement = (<HTMLUListElement>document.createElement('ul'));
    let thisIssue: HTMLLIElement = (<HTMLLIElement>document.createElement('li'));
    InspSched.BuildCalendar(null, error);

    thisHeading.innerText = "The following issue is preventing the ability to schedule an inspection:";

    thisIssue.textContent = error;
    thisIssue.style.marginLeft = "2rem;";

    IssueList.appendChild(thisIssue);
    reasons.appendChild(IssueList);
    document.getElementById("NotScheduled").style.display = "flex";
    
  }

  //function permitSchedulingIssue(key: string)
  //{
  //  let InspTypeList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById('InspTypeSelect'));
  //  clearElement(InspTypeList);
  //  let e: HTMLElement = document.getElementById('SuspendedPermit');
  //  clearElement(e);
  //  let message: HTMLHeadingElement = (<HTMLHeadingElement>document.createElement("h5"));
  //  message.appendChild(document.createTextNode("A new inspection cannot be scheduled for permit #" + key + "."));
  //  message.appendChild(document.createElement("br"));
  //  message.appendChild(document.createElement("br"));

  //  message.appendChild(document.createTextNode(

  //    "\nPlease contact the Building Department " +
  //    "for assistance at 904-284-6307.  There are multiple " +
  //    "reasons an inspection may not " +
  //    "be scheduled on-line " +
  //    "(fees due, permit problems, holds, or licensing issues)."

  //  ));

  //  e.appendChild(message);
  //  document.getElementById('SuspendedContractor').style.removeProperty("display");
  //}

  function IsGoodCancelDate(inspection: Inspection, IsExternalUser: boolean): boolean
  {
    let tomorrow = new Date();
    let inspDate = new Date(inspection.DisplaySchedDateTime);
    var dayOfMonth = tomorrow.getDate() + 1;
    //today.setDate( dayOfMonth - 20 );

    if (inspDate < tomorrow && IsExternalUser)
      return false;

    return true;
  }
}