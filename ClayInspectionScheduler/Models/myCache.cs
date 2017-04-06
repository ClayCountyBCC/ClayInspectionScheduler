using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime;
using System.Runtime.Caching;

namespace InspectionScheduler.Models
{
  public class MyCache
  {
    private static MemoryCache _cache = new MemoryCache("myCache");

    public static object GetItem(bool isExternal)
    {
      string key = isExternal.ToString ( );

      return GetOrAddExisting (key, isExternal,() => getDateString()) ;
    }

    public static object GetItem(bool isExternal, CacheItemPolicy CIP )
    {
      string key = isExternal.ToString ( );
      return GetOrAddExisting(key,isExternal, () => getDateString(), CIP);
    }

    private static T GetOrAddExisting<T>(string key,bool isExternal, Func<T> valueFactory, CacheItemPolicy CIP)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting( key, newValue, CIP) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove( key );
        throw;
      }
    }
                                       
    private static T GetOrAddExisting<T>(string key, bool isExternal, Func<T> valueFactory)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, GetCIP()) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static CacheItemPolicy GetCIP()
    {
      return new CacheItemPolicy()
      {
        AbsoluteExpiration = DateTime.Now.AddHours(12)
      };
    }

    public static List<DateTime> getDateList(bool isExternal = true)
    {

      return Dates.generateDates (isExternal);

    }

    public static List<string> getDateString()
    {
      //TODO: code function checkIfExternal();  currently showing External dates only
      var realDates = getDateList (/* checkIfExternal()*/);

      return ( from d in realDates select d.ToShortDateString ( ) ).ToList ( );
    }

  }
}