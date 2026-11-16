#import <Foundation/Foundation.h>
#import "VNLunar.h"
int main(void){ @autoreleasepool {
  NSArray *can=@[@"Giáp",@"Ất",@"Bính",@"Đinh",@"Mậu",@"Kỷ",@"Canh",@"Tân",@"Nhâm",@"Quý"];
  NSArray *chi=@[@"Tý",@"Sửu",@"Dần",@"Mão",@"Thìn",@"Tỵ",@"Ngọ",@"Mùi",@"Thân",@"Dậu",@"Tuất",@"Hợi"];
  NSMutableArray *nh=[NSMutableArray new], *q=[NSMutableArray new];
  for (int i=0;i<60;i++) { NSString *k=[NSString stringWithFormat:@"%@ %@",can[i%10],chi[i%12]]; [nh addObject:[VNLunar nguHanh:k] ?: @""]; }
  for (int i=222;i<444;i++) [q addObject:[VNLunar quotAtJdDay:i]];
  NSData *d=[NSJSONSerialization dataWithJSONObject:@{@"napAm":nh,@"quotes":q} options:0 error:nil];
  [[NSFileHandle fileHandleWithStandardOutput] writeData:d];
}}
