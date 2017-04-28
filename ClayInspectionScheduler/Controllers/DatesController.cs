using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
  public class DatesController : ApiController
  {
    public IHttpActionResult Get()
    {
      List<string> lat = (List<string>)MyCache.GetItem("inspectionshortdates,true");
      if (lat == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(lat);
      }
    }
    public IHttpActionResult Get(string id)
    { 
      List<string> lat = Dates.GetGracePeriodDate( id );
      if (lat == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(lat);
      }
    }


  }
}
