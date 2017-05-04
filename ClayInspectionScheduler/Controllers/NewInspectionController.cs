using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
  public class NewInspectionController :ApiController
  {
    public IHttpActionResult Save( NewInspection thisInspection )
    {
      var IsExternalUser = Constants.CheckIsExternalUser();
      var e = thisInspection.Validate( IsExternalUser );
      if( e.Count() > 0 )
      {
        // this means that errors were encounted in the validation process.
        // we should return them so that the client can make an informed decision.
        return null;
      }
      else
      {
        if( !thisInspection.Save(IsExternalUser) )
        {
          return null;
        }
      }

      //List<string> lp = NewInspection.Post(thisInspection);
      //if (lp == null)
      //{
      //  return InternalServerError();
      //}
      //else
      //{
      //  return Ok(lp);
      //}
      return null;

    }
  }
}
