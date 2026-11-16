#import <Foundation/Foundation.h>
#import "VNLunar.h"
int main(int argc, const char **argv) {
  @autoreleasepool {
    int y0 = atoi(argv[1]), y1 = atoi(argv[2]);
    NSFileHandle *out = [NSFileHandle fileHandleWithStandardOutput];
    for (int y = y0; y <= y1; y++) for (int m = 1; m <= 12; m++) {
      NSRange r = [[NSCalendar currentCalendar] rangeOfUnit:NSCalendarUnitDay inUnit:NSCalendarUnitMonth forDate:[[NSCalendar currentCalendar] dateFromComponents:({NSDateComponents *c=[NSDateComponents new]; c.year=y; c.month=m; c.day=1; c;})]];
      for (int d = 1; d <= (int)r.length; d++) { @autoreleasepool {
        NSMutableDictionary *info = [VNLunar getHoroscopeDayInfo:d :m :y];
        NSError *e; NSData *j = [NSJSONSerialization dataWithJSONObject:info options:NSJSONWritingSortedKeys error:&e];
        if (!j) { fprintf(stderr, "ERR %d-%d-%d %s\n", y,m,d, e.description.UTF8String); continue; }
        [out writeData:j]; [out writeData:[@"\n" dataUsingEncoding:NSUTF8StringEncoding]];
      }}
    }
  }
  return 0;
}
