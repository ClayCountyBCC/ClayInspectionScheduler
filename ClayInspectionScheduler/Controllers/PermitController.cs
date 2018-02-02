using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  [RoutePrefix("API/Permit")]
  public class PermitController : ApiController
  {
    [HttpGet]
    [Route("Get/{PermitNumber}")]
    public IHttpActionResult Get(string PermitNumber)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      List<Permit> lp = Permit.Get(PermitNumber, ua.current_access);

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
