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

      List<Permit> lp = Permit.Get(
        id, 
        Constants.CheckIsExternalUser(User.Identity.Name), 
        Constants.CheckIsSupervisor(User.Identity.Name));
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
