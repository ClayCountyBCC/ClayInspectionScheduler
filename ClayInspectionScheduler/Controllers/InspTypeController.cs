using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
  public class InspTypeController : ApiController
  {
    public IHttpActionResult Get()
    { 
      
      List<InspType> lp = (List<InspType>)MyCache.GetItem("inspectiontypes");
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
