using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
    public class NewInspectionController : ApiController
    {
      public IHttpActionResult Post( NewInspection thisInspection)
      {
      var e = thisInspection.Validate(false);
      if(e.Count() > 0)
      {
        // this means that errors were encounted in the validation process.
        // we should return them so that the client can make an informed decision.
      } else
      {
        if (!thisInspection.Save())
        {

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

    }
  }
}
