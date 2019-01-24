/// <reference path="XHR.ts" />
/// <reference path="Permit.ts" />
/// <reference path="newinspection.ts" />
/// <reference path="Inspection.ts" />

namespace InspSched.transport
{
  "use strict"

  export function GetPermit(key: string): Promise<Array<Permit>>
  {
    if (key == null) return;
    var x = XHR.Get("API/Permit/Get/" + key);
    return new Promise<Array<Permit>>(function (resolve, reject)
    {
      x.then(function (response)
      {
        let pl: Array<Permit> = JSON.parse(response.Text);
        resolve(pl);
      }).catch(function ()
      {
        console.log("error in GetPermit");
        reject(null);
      });
    });
  }

  export function GetInspType()
  {
    var x = XHR.Get("API/InspType/");
    return new Promise<Array<InspType>>(function (resolve, reject)
    {
      x.then(function (response)
      {
        let pl: Array<InspType> = JSON.parse(response.Text);
        resolve(pl);
      }).catch(function ()
      {
        console.log("error in GetInspTypeList");
        reject(null);
      });
    });
  }

  export function GetInspections(key: string): Promise<Array<Inspection>>
  {
    if (key == null) return;

    var x = XHR.Get("API/Inspection/Permit/" + key);
    return new Promise<Array<Inspection>>(function (resolve, reject)
    {
      x.then(function (response)
      {

        let il: Array<Inspection> = JSON.parse(response.Text);
        resolve(il);

      }).catch(function ()
      {
        console.log("error in GetInspections");
        reject(null);

      });
    });
  }

  export function SaveInspection(thisInspection: NewInspection): Promise<Array<string>>
  {
    var x = XHR.Post("API/NewInspection/", JSON.stringify(thisInspection));
    return new Promise<Array<string>>(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di: Array<string> = JSON.parse(response.Text);
        UI.GetInspList(thisInspection.PermitNo);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in SaveInspections");
        UI.GetInspList(thisInspection.PermitNo);
        reject(null);
      });
    });

  }

  export function AddComment(InspectionId: number, Comment: string)
  {
    var data = {
      'InspectionId': InspectionId,
      'Comment': Comment
    };

    var x = XHR.Post("API/Inspection/Comment/", JSON.stringify(data));
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in Post Comment");
        reject(null);
      });
    });
  }

  export function CancelInspection(InspectionId: number, PermitNumber: string)
  {
    if (PermitNumber == null || InspectionId == null) return;

    var x = XHR.Post("API/Inspection/PublicCancel/" + PermitNumber + "/" + InspectionId);
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in GetInspections");
        reject(null);
      });
    });
  }

  export function UpdateInspection(
    PermitNumber: string,
    InspectionId: number,
    ResultCode: string,
    Remarks: string,
    Comments: string)
  {
    var data = {
      'permitNumber': PermitNumber,
      'inspectionId': InspectionId,
      'resultCode': ResultCode,
      'remark': Remarks,
      'comment': Comments
    };

    var x = XHR.Post("API/Inspection/Update/", JSON.stringify(data));
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in Inspection Update");
        reject(null);
      });
    });
  }

  export function DailyInspections()
  {
    var x = XHR.Get("API/Inspection/List");
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);        
        resolve(di);

      }).catch(function ()
      {
        console.log("error in Daily Inspections");
        reject(null);
      });
    });
  }

  export function Inspectors()
  {
    var x = XHR.Get("API/Inspection/Inspectors");
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in Get Inspectors");
        reject(null);
      });
    });
  }

  export function GetInspectionQuickRemarks()
  {
    var x = XHR.Get("API/Inspection/QuickRemarks");
    return new Promise(function (resolve, reject)
    {
      x.then(function (response)
      {
        var di = JSON.parse(response.Text);
        resolve(di);

      }).catch(function ()
      {
        console.log("error in Get Quick Remarks");
        reject(null);
      });
    });
  }
  


}
