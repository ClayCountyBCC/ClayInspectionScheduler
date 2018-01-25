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
    public IHttpActionResult Update(string PermitNo, string InspID, char ResultADC, string Remark)
    {
      var CanSetResult = true;
      if (CanSetResult)
      {
        bool sr = Inspection.UpdateInspectionResult(
                   PermitNo,
                   InspID,
                   ResultADC,
                   Remark,
                   User.Identity.Name);
        if (!sr)
        {
          return InternalServerError();
        }
        else
        {
          return Ok(sr);
        }
      }
      return Ok(false);
    }


    // Incorrectly named
    // The called function does not delete the inspection row, 
    // only changes ResultADC of the inspection to 'C' (Cancel.)
    public IHttpActionResult Delete(string id, string InspId)
    {

      bool lp = Inspection.Cancel(id, InspId);
      if (!lp)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(lp);
      }

    }

  }


}
