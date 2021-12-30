using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  public class NewInspectionController : ApiController
  {

    public IHttpActionResult Save(NewInspection thisInspection)
    {

      if (thisInspection == null)
      {
        return InternalServerError();
      }
      else
      {
        var ua = new UserAccess(User.Identity.Name);
        var e = thisInspection.Save(ua);

        return Ok(e);
      }
    }
  }
}
