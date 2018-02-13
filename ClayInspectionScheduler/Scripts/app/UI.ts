/// <reference path="app.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />


namespace InspSched.UI
{
  "use strict";
  export let CurrentPermits: Array<Permit> = new Array<Permit>();
  export let CurrentInspections: Array<Inspection> = [];
  export let PermitsWithOutInsp: Array<string> = [];
  export let CurrentDetailsOpen: string = "";


  export function Search(key: string)
  {
    clearElement(document.getElementById('SearchFailed'));
    Hide('PermitSelectContainer');
    Hide('CurrentPermitData')
    Hide('CurrentPermit')
    Hide('InspectionTable');
    Hide('SearchFailed');
    Hide('SuspendedContractor');
    Hide('NotScheduled');
    Show('Searching');

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

    if (permits.length == 0)
    {
      UpdateSearchFailed(key);
    }
    else 
    {
      AddPermit(permits, key);
      UpdatePermitData(key, permits);
      Hide('Searching');
      document.getElementById('CurrentPermitData').style.display = "flex";
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
    clearElement(street);
    clearElement(city);

    let permit: Permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key })[0];

    street.appendChild(document.createTextNode(permit.ProjAddrCombined.trim()));
    city.appendChild(document.createTextNode(permit.ProjCity.trim()));


    Show('PermitSelectContainer');


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
    option.appendChild(document.createTextNode(permit.PermitNo + "  (" + label + ")"));

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
    Hide('SuspendedContractor');

    clearElement(document.getElementById('InspListData'));

    transport.GetInspections(key).then(function (inspections: Array<Inspection>)
    {
      if (inspections.length > 0)
      {
        InspSched.CurrentInspections = inspections;
        BuildInspectionList(InspSched.CurrentInspections, permit);
      }
      else
      {
        // TODO: add 'NO INSPECTIONS ERROR'
        document.getElementById('NoInspections').style.display = "flex";
        document.getElementById("InspSched").style.display = "flex";
        document.getElementById('InspectionTable').style.display = "flex";

      }
      BuildScheduler(InspSched.CurrentInspections, key);

      return true;
    }, function ()
      {
        console.log('error getting inspections');
        return false;
      });
  }

  export function BuildInspectionList(inspections: Array<Inspection>, permit?: Permit)
  {
    //For testing ONLY

    // Initialize element variable for list container 'InspListData'
    let InspList: HTMLTableElement = (<HTMLTableElement>document.getElementById('InspListData'));
    let empty: HTMLElement = (<HTMLElement>document.createElement("tr"));

    // TODO: add Try/Catch

    // create (call BuildInspectioN()) and add inspection row to container InspList
    console.log('inspections', inspections);
    for (let inspection of inspections)
    {

      if (permit)
      {
        if (permit.access === InspSched.access_type.public_access)
        {
          inspection.Comment = "";
        }

      }

      InspList.appendChild(BuildInspectionRow(inspection));
    }

    InspList.style.removeProperty("display");

    document.getElementById("InspSched").style.removeProperty("display");
    document.getElementById('InspectionTable').style.display = "flex";

  }

  // update BuildInspectionRow
  function BuildInspectionRow(inspection: Inspection)
  {

    let permit: Permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === inspection.PermitNo })[0];
    //permit.access = access_type.inspector_access;

    let today = new Date().setHours(0, 0, 0, 0);
    let SchedDate = Date.parse(inspection.DisplaySchedDateTime);

    let inspdetail: string = inspection.InspReqID.toString() + "_comments";


    let inspRow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspRow.setAttribute("elementName", "inspRow");

    // Set Inspection Row element classes 
    if (inspection.ResultADC.length == 0)
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle";
    else if (inspection.ResultADC == 'A' || inspection.ResultADC == 'P')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle PassRow";
    else if (inspection.ResultADC == 'C')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle CancelRow"
    else if (inspection.ResultADC == 'F' || inspection.ResultADC == 'D' || inspection.ResultADC == 'N')
      inspRow.className = "InspRow large-12 medium-12 small-12 row flex-container align-middle FailRow";


    // #region DataRow
    //*******************************************************************************************
    let DataRow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    DataRow.className = "large-12 medium-12 small-12 row flex-container align-middle";
    DataRow.setAttribute("elementName", "dataColumn");

    let inspectionData: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspectionData.setAttribute("elementName", "inspectionData");
    inspectionData.className = "large-10 medium-8 small-12";

    let permitNumber: HTMLDivElement = (<HTMLDivElement>document.createElement('div'));
    permitNumber.className = "large-2 medium-6 small-6 column InspPermit ";
    permitNumber.setAttribute("elementName", "permitNumber");

    let inspDesc: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspDesc.className = "large-5 medium-6 small-6 InspType column";
    inspDesc.setAttribute("elementName", "inspDesc");
    inspDesc.appendChild(document.createTextNode(inspection.InsDesc.trim()));

    let inspDateTime: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspDateTime.className = "large-2 medium-6 small-6 column InspDate";
    inspDateTime.setAttribute("elementName", "inspDateTime");

    let inspector: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    inspector.className = "large-3 medium-6 small-12 InspResult column end";
    inspector.setAttribute("elementName", "inspector");
    inspector.appendChild(document.createTextNode(inspection.InspectorName.trim()));

    //********************************************
    let InspButtonDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    InspButtonDiv.setAttribute("elementName", "InspButtonDiv");
    InspButtonDiv.className = "ButtonContainer row large-2 medium-4 small-12 flex-container align-center";

    // #endregion

    // #region Completed Remarks Row
    //*******************************************************************************************
    let DetailsContainer: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    DetailsContainer.className = "large-12 medium-12 small-12 row flex-container align-middle details-container";
    DetailsContainer.setAttribute("elementName", "DetailsSection");


    //*********************************************
    let CompletedRemarks: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    CompletedRemarks.setAttribute("elementName", "CompletedRemarks");
    CompletedRemarks.className = "large-12 medium-12 small-12 row";
    CompletedRemarks.id = inspection.InspReqID.toString() + "_completed_remark";
    CompletedRemarks.style.display = "flex";

    let Remark: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    Remark.className = "column large-9 medium-8 small-6 inspRemarks";
    Remark.setAttribute("elementName", "Remark");
    Remark.appendChild(document.createTextNode((inspection.Remarks !== null && inspection.Remarks !== "" ? inspection.Remarks.trim() : "")));

    let ResultDescription: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    ResultDescription.setAttribute("elementName", "ResultDescription");
    ResultDescription.className = "large-3 medium-4 small-6 InspResult column large-text-left text-center end ";
    ResultDescription.appendChild(document.createTextNode(inspection.ResultDescription.trim()));
    // #endregion

    // #region add Remarks Container: add Remarks textarea, button, and radiobutton sections
    //*******************************************************************************
    let addRemarkContainer: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    addRemarkContainer.setAttribute("elementName", "addRemarkContainer");
    addRemarkContainer.className = "large-12 medium-12 small-12 row flex-container align-middle add-remark-container";
    addRemarkContainer.id = inspection.InspReqID + "_add_remark";
    addRemarkContainer.style.display = "none";

    //***************************************
    let addRemark: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    addRemark.setAttribute("elementName", "addRemark");
    addRemark.className = "row large-12 medium-12 small-12 flex-container flex-child-grow";



    let addRemarkLabel: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
    addRemarkLabel.setAttribute("elementName", "addRemarkLabel");
    addRemarkLabel.className = "large-12 medium-12 small-12 row ";
    addRemarkLabel.textContent = "Public Remarks:";
    addRemarkLabel.style.textAlign = "left";

    let addRemarkTextDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    addRemarkTextDiv.className = "large-10 medium-8 small-12 flex-dir-row";
    addRemarkTextDiv.style.paddingLeft = "1em";


    let remarkTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.createElement("textarea"));
    remarkTextarea.setAttribute("elementName", "remarkTextarea");
    remarkTextarea.setAttribute("onkeyup", "InspSched.disableSaveCommentButton(" + inspection.InspReqID + ")");
    remarkTextarea.className = "remark-text";
    remarkTextarea.rows = 1;
    remarkTextarea.id = inspection.InspReqID + "_remark_textarea";



    let addRemarkButtonDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    addRemarkButtonDiv.setAttribute("elementName", "addRemarkButtonDiv");
    addRemarkButtonDiv.className = "ButtonContainer column large-2 medium-4 small-12 flex-container align-center flex-child-grow";

    let addRemarkButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
    addRemarkButton.setAttribute("elementName", "addRemarkButton");
    addRemarkButton.setAttribute("disabled", "disabled");
    addRemarkButton.setAttribute("value", inspection.ResultADC);
    addRemarkButton.id = inspection.InspReqID + "_save_remark_button";
    addRemarkButton.setAttribute("onclick", "(InspSched.UpdateInspection(" + permit.PermitNo + ", " + inspection.InspReqID + "))");
    addRemarkButton.className = "align-self-center columns DetailsButton large-12 medium-12-small-12";
    addRemarkButton.style.margin = "0";
    addRemarkButton.textContent = "Save Result";


    //***************************************
    let radioButtonSection: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    radioButtonSection.setAttribute("elementName", "radioButtonSection");
    radioButtonSection.className = "large-12 medium-12 small-12 column";
    radioButtonSection.style.paddingLeft = "1em";



    // #endregion Remarks Container: add Remarks textarea, button, and radiobutton sections

    // #region Comment Section
    //*********************************************************************************
    let CommentContainer: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    CommentContainer.className = "large-12 medium-12 small-12 row flex-container comment-container completed-comments-textarea";
    CommentContainer.setAttribute("elementName", "CommentContainer");
    CommentContainer.style.display = "none";
    CommentContainer.id = inspection.InspReqID + "_comments";


    let textboxdiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    textboxdiv.setAttribute("elementName", "textboxdiv");
    textboxdiv.className = "large-12 medium-12 small-12 row completed-comments-textarea ";
    textboxdiv.style.display = "flex";


    let thiscomment: HTMLTextAreaElement = (<HTMLTextAreaElement>document.createElement("textarea"));
    thiscomment.setAttribute("elementName", "thiscomment");
    thiscomment.id = inspection.InspReqID + "_audit"
    thiscomment.className = "row large-12 medium-12 small-12 No-Edit";
    thiscomment.rows = 4;

    let AddCommentDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    AddCommentDiv.setAttribute("elementName", "AddCommentDiv");
    AddCommentDiv.className = "row large-12 medium-12 small-12 flex-container flex-child-grow";
    AddCommentDiv.style.paddingLeft = "1em";

    let commentlabel: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
    commentlabel.setAttribute("elementName", "commentlabel");
    commentlabel.className = "large-12 medium-12 small-12 row ";
    commentlabel.style.textAlign = "left";
    commentlabel.innerText = "Add Comments:";

    let AddCommentTextarea: HTMLTextAreaElement = (<HTMLTextAreaElement>document.createElement("textarea"));
    AddCommentTextarea.setAttribute("elementName", "AddCommentTextarea");
    AddCommentTextarea.className = "large-10 medium-10 small-12 flex-dir-row Comment-Textarea";
    AddCommentTextarea.style.resize = "none";
    AddCommentTextarea.rows = 3;
    AddCommentTextarea.id = inspection.InspReqID + "_comment_textarea";
    AddCommentTextarea.maxLength = 200;


    let SaveCommentButtonDiv: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));
    SaveCommentButtonDiv.setAttribute("elementName", "SaveCommentuttonDiv");
    SaveCommentButtonDiv.className = "ButtonContainer row large-2 medium-2 small-12 flex-container align-center";

    let SaveCommentButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
    SaveCommentButton.className = "button align-self-center columns SaveCommentButton";
    SaveCommentButton.setAttribute("elementName", "SaveCommentButton");
    SaveCommentButton.setAttribute("onclick", "InspSched.SaveComment('" + inspection.InspReqID + "','" + AddCommentTextarea.value + "')");
    SaveCommentButton.textContent = "Save Comment";
    SaveCommentButton.id = inspection.InspReqID + "_save_comment_button";



    //if (inspection.comments.length > 0)
    //{
    //  CommentContainer.appendChild(1234567_textboxdiv);
    //}
    //1234567_commnents.appendChild(AddCommentDiv);

    //AddCommentDiv.appendChild(commentlabel);
    //AddCommentDiv.appendChild(AddCommentTextarea);
    //SaveCommentButtonDiv.appendChild(SaveCommentButton)
    //AddCommentDiv.appendChild(SaveCommentButtonDiv);



    // #endregion Comment Secion

    //*********************************************
    // Set permit number as link if internal user 
    if (permit.access !== InspSched.access_type.public_access)
    {
      let link = <HTMLAnchorElement>document.createElement("a");
      link.style.textDecoration = "underline";
      link.href = permit.Permit_URL;
      link.appendChild(document.createTextNode(inspection.PermitNo));
      permitNumber.appendChild(link);
    }
    else
    {
      permitNumber.appendChild(document.createTextNode(inspection.PermitNo));
    }

    // if inspection is incomplete, set date to InspSched, else InspDate
    if (inspection.DisplayInspDateTime.toLowerCase() == 'incomplete')
    {
      inspDateTime.appendChild(document.createTextNode(inspection.DisplaySchedDateTime));
    }
    else
    {
      inspDateTime.appendChild(document.createTextNode(inspection.DisplayInspDateTime));
    }

    // #region Initial Append Rows to Inspection Row
    inspectionData.appendChild(permitNumber);
    inspectionData.appendChild(inspDateTime);
    inspectionData.appendChild(inspDesc);
    inspectionData.appendChild(inspector);

    DataRow.appendChild(inspectionData);

    inspRow.appendChild(DataRow);


    // Sections added below are dependent on access_type and date
    // cannot be public and cannot be earlier than today (will be changed to earlier date)

    if (permit.access != InspSched.access_type.public_access && inspection.Day != "")
    {
      addRemarkTextDiv.appendChild(remarkTextarea);
      addRemarkButtonDiv.appendChild(addRemarkButton);
      addRemark.appendChild(addRemarkLabel);
      addRemark.appendChild(addRemarkTextDiv);
      addRemark.appendChild(addRemarkButtonDiv);

      addRemarkContainer.appendChild(addRemark);

      radioButtonSection.appendChild(BuildRadioButtonRow(inspection.InspReqID.toString(), inspection.ResultADC, permit.access, 0));

      addRemarkContainer.appendChild(radioButtonSection);

    }



    // #endregion Initial Append Rows to Inspection Row

    let detailButton = BuildButton(inspection.InspReqID + "_details_btn", "Details", "InspSched.UI.ToggleInspDetails(this.value)", inspection.InspReqID.toString())
    detailButton.className = "column large-12 medium-12 small-12 align-self-center  DetailsButton";

    //Create function to make New/Cancel/Details Button
    if ((inspection.ResultADC.length > 0 || inspection.DisplaySchedDateTime.length === 0))
    {

      let buttonId: string = "CreateNew_" + inspection.PermitNo;
      if (!document.getElementById(buttonId) && permit.ErrorText.length === 0)
      {
        InspButtonDiv.appendChild(BuildButton(buttonId, "New", "InspSched.UpdatePermitSelectList('" + inspection.PermitNo + "');"));
      }
      else
      {
        detailButton.style.margin = "0";
      }

      if (permit.access !== InspSched.access_type.public_access)
      {
        InspButtonDiv.appendChild(detailButton);
      }

    }
    else if (inspection.ResultADC.length == 0) 
    {
      if (IsGoodCancelDate(inspection, permit.access))
      {
        if (permit.access === InspSched.access_type.public_access) 
        {
          let privprovstring: string = permit.ErrorText.substr(2, 16).toLowerCase();

          if (privprovstring != "private provider" || inspection.PrivateProviderInspectionRequestId != null)
          {
            InspButtonDiv.appendChild(BuildButton("", "Cancel", "InspSched.CancelInspection(" + inspection.InspReqID + ", '" + inspection.PermitNo + "');"));
          }
        }
        else
        {


          detailButton.style.margin = "0";
          InspButtonDiv.appendChild(detailButton);

        }
      }
    }

    DataRow.appendChild(InspButtonDiv);

    if (inspection.DisplayInspDateTime.length > 0)
    {
      if (inspection.InspReqID.toString() !== "99999999")
      {

        CompletedRemarks.appendChild(Remark);
        CompletedRemarks.appendChild(ResultDescription);

        // remarks needs to be in the inspection data
        inspectionData.appendChild(CompletedRemarks);
      }
      else
      {
        inspector.style.display = 'none';
        inspDateTime.style.display = 'none';
        inspDesc.className = "large-10 medium-6 small-6 InspType InspResult column";
      }

    }

    // SET COMMENTS
    if (inspection.Comment.length > 0)
    {
      thiscomment.textContent = inspection.Comment;
      thiscomment.readOnly = true;
      thiscomment.contentEditable = "false";
      thiscomment.style.margin = "0";
      thiscomment.style.overflowY = "scroll";
      thiscomment.style.display = "flex";

      textboxdiv.appendChild(thiscomment);
      textboxdiv.style.display = "flex";

      CommentContainer.appendChild(textboxdiv);

    }

    AddCommentDiv.appendChild(commentlabel);
    AddCommentDiv.appendChild(AddCommentTextarea);

    SaveCommentButtonDiv.appendChild(SaveCommentButton);
    AddCommentDiv.appendChild(SaveCommentButtonDiv);

    CommentContainer.appendChild(AddCommentDiv);


    if (permit.access !== InspSched.access_type.public_access)
    {
      DetailsContainer.appendChild(addRemarkContainer);
      DetailsContainer.appendChild(CommentContainer);
    }



    inspRow.appendChild(DetailsContainer);
    return inspRow;

  }

  function BuildButton(buttonId: string, label: string, functionCall: string, value?: string): HTMLButtonElement
  {
    let InspButton: HTMLButtonElement = (<HTMLButtonElement>document.createElement("button"));
    InspButton.id = buttonId;
    InspButton.value = "";
    InspButton.className = "align-self-center columns NewInspButton";
    InspButton.appendChild(document.createTextNode(label));
    InspButton.setAttribute("onclick", functionCall);

    InspButton.value = (value == null ? "" : value);

    return InspButton;
  }

  function BuildRadioButtonRow(InspectionId: string, checked: string, access: access_type, privateProvidercheck: number)
  {

    let RadioButtonSubrow: HTMLDivElement = (<HTMLDivElement>document.createElement("div"));

    if (access === access_type.inspector_access)
    {
      RadioButtonSubrow.className = "large-10 medium-10 small-12 flex-container flex-dir-row flex-child-grow align-justify row";
      RadioButtonSubrow.id = InspectionId + "_radio_list";

      let approveradio: HTMLInputElement = (<HTMLInputElement>document.createElement("input"));
      approveradio.id = (privateProvidercheck > 0 ? "perform" : "approve") + "_selection";
      approveradio.type = "radio";
      approveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
      if (checked == "A" || checked == "P")
      {
        approveradio.checked = true;
      }
      approveradio.name = InspectionId + "_results";
      approveradio.value = (privateProvidercheck > 0 ? "P" : "A");

      let approve: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
      approve.className = "column large-2 small-6";
      approve.htmlFor = "approve_selection";
      approve.appendChild(approveradio);
      approve.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Perform" : "Approve"));

      let disapproveradio: HTMLInputElement = (<HTMLInputElement>document.createElement("input"));
      disapproveradio.id = (privateProvidercheck > 0 ? "not_performed" : "disapprove") + "_selection";
      disapproveradio.type = "radio";
      disapproveradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
      if (checked == "D" || checked == "N")
      {
        disapproveradio.checked = true;
      }
      disapproveradio.name = InspectionId + "_results";

      disapproveradio.value = (privateProvidercheck > 0 ? "N" : "D");

      let disapprove: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
      disapprove.className = "column large-2 small-6";
      disapprove.htmlFor = "disapprove_selection";
      disapprove.appendChild(disapproveradio);
      disapprove.appendChild(document.createTextNode(privateProvidercheck > 0 ? "Not Performed" : "Disapprove"));


      RadioButtonSubrow.appendChild(approve);
      RadioButtonSubrow.appendChild(disapprove);

    }
    else
    {
      RadioButtonSubrow.className = "large-10 medium-10 small-12 flex-container flex-dir-row flex-child-grow align-right";
    }

    let cancelradio: HTMLInputElement = (<HTMLInputElement>document.createElement("input"));
    cancelradio.id = "cancelradio_selection";
    cancelradio.type = "radio";
    cancelradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
    if (checked == "C")
    {
      cancelradio.checked = true;
    }
    cancelradio.name = InspectionId + "_results";
    cancelradio.value = "C";

    let cancel: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
    cancel.className = "column large-2 small-6";
    cancel.htmlFor = "cancelradio_selection";
    cancel.appendChild(cancelradio);
    cancel.appendChild(document.createTextNode("Cancel"));

    let incompleteradio: HTMLInputElement = (<HTMLInputElement>document.createElement("input"));
    incompleteradio.id = "incompleteradio_selection";
    incompleteradio.type = "radio";
    incompleteradio.setAttribute("onclick", "InspSched.disableSaveCommentButton(" + InspectionId + ")");
    if (checked == "")
    {
      incompleteradio.checked = true;
    }
    incompleteradio.name = InspectionId + "_results";
    incompleteradio.value = "";

    let incomplete: HTMLLabelElement = (<HTMLLabelElement>document.createElement("label"));
    incomplete.className = "column large-2 small-6";
    incomplete.htmlFor = "incompleteradio_selection";
    incomplete.appendChild(incompleteradio);
    incomplete.appendChild(document.createTextNode("Incomplete"));

    RadioButtonSubrow.appendChild(cancel);
    RadioButtonSubrow.appendChild(incomplete);


    return RadioButtonSubrow;
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
    LoadInspTypeSelect(key);
    InspSched.BuildCalendar(InspSched.ThisPermit.ScheduleDates, InspSched.ThisPermit.ErrorText);

    document.getElementById('InspectionScheduler').setAttribute("value", key);

  }

  export function LoadInspTypeSelect(key: string)
  {

    let thistype: string = key[0];
    var label: string = getInspTypeString(thistype);

    let InspTypeList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById('InspTypeSelect'));
    let optionLabel: HTMLOptionElement = (<HTMLOptionElement>document.createElement("option"));

    clearElement(InspTypeList);
    optionLabel.appendChild(document.createTextNode(label + " Inspections:"));

    optionLabel.className = "selectPlaceholder";
    optionLabel.selected;
    optionLabel.value = "";
    InspTypeList.appendChild(optionLabel);

    let permit: Permit = InspSched.CurrentPermits.filter(function (p) { return p.PermitNo === key })[0];
    let filteredInspectionTypes = InspSched.InspectionTypes.filter(
      function (inspectionType)
      {
        if (inspectionType.InspCd[0] === thistype)
        {
          if (permit.NoFinalInspections)
          {
            return !inspectionType.Final;
          }
          else
          {
            return true;
          }
        }
      });

    //for (let type of InspSched.InspectionTypes)
    for (let type of filteredInspectionTypes)
    {
      if (type.InspCd[0] == thistype)
      {
        let option: HTMLOptionElement = <HTMLOptionElement>document.createElement("option");
        option.label = type.InsDesc;
        option.value = type.InspCd;
        option.className = "TypeSelectOption";
        option.appendChild(document.createTextNode(type.InsDesc));
        InspTypeList.appendChild(option);
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
          e.style.display = "flex";
        else
          e.style.display = displayType;
      }
    }
    else
    {
      let e = document.getElementById(id);
      if (displayType == null)
        element.style.display = "flex";
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
    Hide("InspectionScheduler");
    clearElement(document.getElementById('InspTypeSelect'));

    let reasons: HTMLDivElement = (<HTMLDivElement>document.getElementById('Reasons'));
    clearElement(reasons);
    let thisHeading: HTMLHeadingElement = (<HTMLHeadingElement>document.getElementById('ErrorHeading'));
    clearElement(thisHeading);

    let IssueList: HTMLUListElement = (<HTMLUListElement>document.createElement('ul'));
    let thisIssue: HTMLLIElement = (<HTMLLIElement>document.createElement('li'));

    thisHeading.appendChild(document.createTextNode("The following issue is preventing the ability to schedule an inspection:"));

    thisIssue.appendChild(document.createTextNode(error));
    thisIssue.style.marginLeft = "2rem;";

    IssueList.appendChild(thisIssue);
    reasons.appendChild(IssueList);
    document.getElementById("NotScheduled").style.display = "flex";

  }

  function IsGoodCancelDate(inspection: Inspection, access: access_type): boolean
  {
    let tomorrow = new Date();
    let inspDate = new Date(inspection.DisplaySchedDateTime);
    var dayOfMonth = tomorrow.getDate() + 1;

    if (inspDate < tomorrow && (access == InspSched.access_type.no_access || access == InspSched.access_type.public_access))
      return false;

    return true;
  }

  export function ToggleInspDetails(value: string): void
  {

    let today = new Date().setHours(0, 0, 0, 0);
    let SchedDate: number;
    for (let i of InspSched.CurrentInspections)
    {
      if (i.InspReqID.toString() == value)
      {
        SchedDate = Date.parse(i.DisplaySchedDateTime);
      }

    } 

    if (InspSched.UI.CurrentDetailsOpen != "" && value.valueOf() != InspSched.UI.CurrentDetailsOpen)
    {


      let CurrentAddRemark: HTMLDivElement = (<HTMLDivElement>document.getElementById(InspSched.UI.CurrentDetailsOpen + '_add_remark'));
      let CurrentCompletedRemark: HTMLDivElement = (<HTMLDivElement>document.getElementById(InspSched.UI.CurrentDetailsOpen + '_completed_remark'));
      let CurrentComments: HTMLDivElement = (<HTMLDivElement>document.getElementById(InspSched.UI.CurrentDetailsOpen + '_comments'));




      CurrentAddRemark.style.display = "none";
      CurrentComments.style.display = "none";



      if (CurrentCompletedRemark != null)
      {
        CurrentCompletedRemark.style.display = "flex";
      }

      document.getElementById(InspSched.UI.CurrentDetailsOpen + '_details_btn').textContent = "Details";
    }


    let addRemark: HTMLDivElement = (<HTMLDivElement>document.getElementById(value.valueOf() + '_add_remark'));
    let completedRemark: HTMLDivElement = (<HTMLDivElement>document.getElementById(value.valueOf() + '_completed_remark'));
    let comments: HTMLDivElement = (<HTMLDivElement>document.getElementById(value.valueOf() + '_comments'));
    let button = document.getElementById(value.valueOf() + '_details_btn');


    let elementState = comments.style.display.toString();
    console.log('comments visible?: ' + elementState);

    if (completedRemark != null && SchedDate >= today)
    {
      completedRemark.style.display = elementState == 'flex' ? 'flex' : 'none';
      console.log('details visibility changed to: ' + completedRemark.style.display.toString());

      if (addRemark != null)
      {
        addRemark.style.display = elementState == 'none' ? 'flex' : 'none';
        console.log('add remark visibility changed to: ' + addRemark.style.display.toString());
      }

    }

    if (comments != null)
    {
      comments.style.display = elementState == 'none' ? 'flex' : 'none';
      console.log('comments visibility changed to: ' + comments.style.display.toString());
    }

    let buttonString = (comments.style.display.toString().toLowerCase() == 'none' ? '' : 'Hide ') + 'Details';

    console.log('Button Text changed to: ' + buttonString);

    document.getElementById(value.valueOf() + '_details_btn').textContent = buttonString;

    let commentfield: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(value.valueOf() + "_comment_textarea"));
    commentfield.value = "";
    let remarkfield: HTMLTextAreaElement = (<HTMLTextAreaElement>document.getElementById(value.valueOf() + "_remark_textarea"));
    remarkfield.value = "";

    InspSched.enableSaveResultButton(value);

    InspSched.UI.CurrentDetailsOpen = value.valueOf();



  }


}