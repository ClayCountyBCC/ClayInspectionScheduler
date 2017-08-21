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
      var IsExternal = Constants.CheckIsExternalUser(User.Identity.Name);
      var IsSupervisor = Constants.CheckIsSupervisor(User.Identity.Name);

      List<Permit> lp = Permit.Get(
        id, 
        IsExternal, 
        (IsExternal ? false : IsSupervisor));

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
