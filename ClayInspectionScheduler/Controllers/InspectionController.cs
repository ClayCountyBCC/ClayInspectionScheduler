using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;


namespace ClayInspectionScheduler.Controllers
{
  [RoutePrefix("API/Inspection")]
  public class InspectionController : ApiController
  {
    [HttpGet]
    [Route("Permit/{PermitNumber}")]
    public IHttpActionResult Permit(string PermitNumber)
    {
      List<Inspection> li = Inspection.Get(PermitNumber);
      if (li == null)
      {
        return InternalServerError();
      }
      else
      {

        foreach(var i in li)
        {
          if(i.ResultADC == "" && i.InspReqID > 0)
          {
            Inspection.AddIRID(i);
          }
        }
        
        return Ok(li);
      }
    }

    // Calls a function to set the result of an inspection
    [HttpPost]
    [Route("Comment")]
    public IHttpActionResult Comment(dynamic CommentData)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      var i = Inspection.AddComment((int)CommentData.InspectionId, (string)CommentData.Comment, ua);

      if (i != null)
      {
        return Ok(i);
      }
      else
      {
        return InternalServerError();
      }

    }

    [HttpPost]
    [Route("Update")]
    public IHttpActionResult Update(dynamic InspectionData)
    {

      //string permitNumber,
      //int inspectionId,
      //string resultCode,
      //string remark,
      //string comment
      var ua = UserAccess.GetUserAccess(User.Identity.Name);

      var sr = Inspection.UpdateInspectionResult(
        (string)InspectionData.permitNumber,
        (int)InspectionData.inspectionId,
        (string)InspectionData.resultCode,
        (string)InspectionData.remark,
        (string)InspectionData.comment,
        ua);

      return Ok(sr);
    }

    [HttpPost]
    [Route("PublicCancel/{permitNumber}/{inspectionId}")]
    public IHttpActionResult PublicCancel(string permitNumber, int inspectionId)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);

      var sr = Inspection.UpdateInspectionResult(
        permitNumber.Trim(),
        inspectionId,
        "C",
        "",
        "",
        ua);

      return Ok(sr);
    }

    [HttpGet]
    [Route("List")]
    public IHttpActionResult List()
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (ua.current_access != UserAccess.access_type.public_access)
      {
        var il = Inspection.GetInspectionList();

        if (il == null)
        {
          return InternalServerError();
        }
        else
        {
          if (ua.current_access == UserAccess.access_type.contract_access)
          {
            il.RemoveAll(i => !ua.display_name.ToLower().StartsWith(i.InspectorName.ToLower()));
          }
          return Ok(il);
        }

      }
      else
      {
        return Ok(new List<Inspection>());
      }
    }

    [HttpGet]
    [Route("Inspectors")]
    public IHttpActionResult Inspectors()
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      var inspectors = new List<Inspector>();

      if (ua.current_access == UserAccess.access_type.public_access)
      {
        inspectors.Add(new Inspector());
      }
      else 
      {
        inspectors.AddRange(Inspector.GetCached());

        if(ua.current_access == UserAccess.access_type.contract_access)
        {
          inspectors.RemoveAll(i => i.NTUsername.ToLower() != ua.user_name.ToLower());
        }
      }

      return Ok(inspectors);
    }

    [HttpGet]
    [Route("QuickRemarks")]
    public IHttpActionResult QuickRemarks()
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (ua.current_access != UserAccess.access_type.public_access)
      {
        return Ok(QuickRemark.GetCachedInspectionQuickRemarks());
      }
      else
      {
        return Ok(new List<string>());
      }
    }

  }
}