using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  public class PermitController : ApiController
  {
    public IHttpActionResult Get(string id)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      List<Permit> lp = Permit.Get(id, ua.current_access);

      if( lp == null)
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
