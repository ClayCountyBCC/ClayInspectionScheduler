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
      List<string> lat = (List<string>)MyCache.GetItem(/* checkExternal()*/ false );
      if ( lat == null )
      {
        return InternalServerError ( );
      }
      else
      {
        return Ok ( lat );
      }

    }
  }
}
