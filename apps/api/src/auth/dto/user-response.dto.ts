import { ApiProperty } from '@nestjs/swagger';

/** The `user` object (architecture §4), for the API docs. */
export class UserDto {
  @ApiProperty({ example: '6650f1c2a9e4b7d1c3a2f001' })
  id!: string;

  @ApiProperty({ example: 'dana@company.com' })
  email!: string;

  @ApiProperty({ example: 'Dana Levi' })
  name!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-04T09:30:00.000Z' })
  createdAt!: string;
}

export class UserResponseDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
