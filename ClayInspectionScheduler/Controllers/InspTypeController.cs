using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  public class InspTypeController : ApiController
  {
    public IHttpActionResult Get()
    {
      List<InspType> lp = InspType.GetCachedInspectionTypes();
      if (lp == null)
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