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
        bool isexternal = Constants.CheckIsExternalUser(User.Identity.Name);
        var e = thisInspection.Save(isexternal, (isexternal ? "OLP": User.Identity.Name));

        return Ok(e);
      }
    }
  }
}
