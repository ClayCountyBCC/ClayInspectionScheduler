using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;


namespace ClayInspectionScheduler.Controllers
{
  public class InspectionController : ApiController
  {
    public IHttpActionResult Get( string id )
    {
      List<Inspection> lp = Inspection.Get ( id );
      if ( lp == null )
      {
        return InternalServerError ( );
      }
      else
      {
        return Ok ( lp );
      }
    }


    // Calls a function to set the result of an inspection
    public IHttpActionResult Comment(
      int InspectionId, 
      string Comment)
    {
      var ua = new UserAccess(User.Identity.ToString());
      if (Inspection.AddComment(InspectionId, Comment, ua))
      {
        return Ok();      
      }
      else
      {
        return InternalServerError();
      }

    }

    public IHttpActionResult Update((
      string permitNumber,
      int inspectionId,
      string resultCode,
      string remark,
      string comment
      ) result)
    {
      var ua = new UserAccess(User.Identity.ToString());

      var sr = Inspection.UpdateInspectionResult(
        result.permitNumber.Trim(),
        result.inspectionId,
        result.resultCode.Trim(),
        result.remark.Trim(),
        result.comment.Trim(),
        ua);

      return Ok(sr);
    }
  }


}
